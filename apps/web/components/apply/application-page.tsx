"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import {
  createInvestorApplication,
  type ApplyDictionary,
  type CountryOption,
  type InvestorApplicationDraft,
  type InvestorType,
  type Locale,
  type PreferredContactMethod,
  type PreferredDepositMethod,
  type ReinvestInterest
} from "@otiz/lib";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator
} from "@otiz/ui";
import { investorApplicationSubmitter } from "./application-submission";

type FormState = Omit<InvestorApplicationDraft, "locale">;

type FormErrors = Partial<Record<keyof FormState | "form", string>>;

const initialForm: FormState = {
  fullName: "",
  telegram: "",
  email: "",
  country: "",
  preferredContactMethod: "telegram",
  plannedAllocationAmount: "",
  preferredDepositMethod: "usdt",
  investorType: "individual",
  reinvestInterest: "not_sure",
  heardFrom: "",
  message: "",
  consent: false,
  promoCode: ""
};

export function ApplicationPage({
  dictionary,
  locale,
  countryOptions
}: {
  dictionary: ApplyDictionary;
  locale: Locale;
  countryOptions: CountryOption[];
}) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [receivedId, setReceivedId] = React.useState<string | null>(null);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      delete next.form;
      return next;
    });
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    const requiredFields: Array<keyof FormState> = ["fullName", "country", "plannedAllocationAmount", "heardFrom"];

    for (const field of requiredFields) {
      if (typeof form[field] === "string" && !form[field].trim()) {
        nextErrors[field] = dictionary.form.validationRequired;
      }
    }

    // Contact: telegram OR email is sufficient (mirrors the server). Only block
    // when BOTH are empty; flag the field so the user sees where to act.
    if (!form.telegram.trim() && !form.email.trim()) {
      nextErrors.telegram = dictionary.form.validationRequired;
      nextErrors.email = dictionary.form.validationRequired;
    }

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = dictionary.form.validationEmail;
    }

    const plannedAmount = Number(form.plannedAllocationAmount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(plannedAmount) || plannedAmount < 5000) {
      nextErrors.plannedAllocationAmount = dictionary.form.validationMinimum;
    }

    if (!form.consent) {
      nextErrors.consent = dictionary.form.validationConsent;
    }

    return nextErrors;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const application = createInvestorApplication({
        ...form,
        locale,
        fullName: form.fullName.trim(),
        telegram: form.telegram.trim(),
        email: form.email.trim(),
        country: form.country.trim(),
        plannedAllocationAmount: form.plannedAllocationAmount.trim(),
        heardFrom: form.heardFrom.trim(),
        message: form.message.trim(),
        promoCode: (form.promoCode ?? "").trim() || undefined
      });
      const submittedEmail = application.email?.trim() || "";
      const result = await investorApplicationSubmitter.submit(application);
      setForm(initialForm);
      // Bind the status page to this exact application. The email remains only
      // as a legacy display fallback if the application cannot be loaded.
      const query = new URLSearchParams({ applicationId: result.id });
      if (submittedEmail) query.set("email", submittedEmail);
      router.push(`/${locale}/apply/status?${query.toString()}`);
    } catch (error) {
      // A rejected promo code surfaces as a field error rather than a generic
      // form error, so the applicant can fix just the code.
      const message = error instanceof Error && error.message ? error.message : dictionary.form.validationRequired;
      if (message === "PROMO_INVALID") {
        setErrors({ promoCode: dictionary.form.promoInvalid });
      } else {
        setErrors({ form: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.16),transparent_34rem),radial-gradient(circle_at_80%_8%,rgba(255,255,255,0.08),transparent_30rem)]" />
      <div className="macro-grid absolute inset-0 opacity-50" />
      <section className="relative z-10 pt-8 sm:pt-10">
        <div className="container">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {dictionary.hero.back}
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-sm font-semibold text-amber-700 dark:text-gold-100 shadow-gold">O</span>
              <span className="hidden text-sm font-semibold tracking-[0.24em] text-foreground sm:inline">OTIZ CAPITAL</span>
            </div>
          </div>
          <div className="grid gap-8 pb-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="lg:sticky lg:top-8"
            >
              <Badge>Investor access</Badge>
              <h1 className="mt-7 font-display text-5xl font-medium leading-[0.95] tracking-[-0.06em] text-balance sm:text-6xl lg:text-7xl">
                {dictionary.hero.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{dictionary.hero.body}</p>
              <div className="mt-10 grid grid-cols-2 gap-3">
                {dictionary.hero.metrics.map((metric) => (
                  <div key={metric.label} className="glass-panel rounded-2xl p-5">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{metric.value}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>
              <TrustSidebar dictionary={dictionary} />
            </motion.div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.985 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.95, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="overflow-hidden rounded-[1.35rem] border-border bg-card dark:border-white/[0.12] dark:bg-graphite-900/[0.78]">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl">{dictionary.form.title}</CardTitle>
                  <CardDescription>{dictionary.form.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  {receivedId ? (
                    <SuccessState dictionary={dictionary} receivedId={receivedId} onReset={() => setReceivedId(null)} />
                  ) : (
                    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
                      {errors.form ? <FormNotice message={errors.form} /> : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <TextField label={dictionary.form.fullName} value={form.fullName} error={errors.fullName} onChange={(value) => updateField("fullName", value)} autoComplete="name" />
                        <TextField label={dictionary.form.telegram} value={form.telegram} error={errors.telegram} onChange={(value) => updateField("telegram", value)} placeholder="@username" />
                        <TextField label={dictionary.form.email} value={form.email} error={errors.email} onChange={(value) => updateField("email", value)} inputMode="email" autoComplete="email" />
                        <CountrySelect
                          label={dictionary.form.country}
                          value={form.country}
                          error={errors.country}
                          options={countryOptions}
                          onSelect={(name) => updateField("country", name)}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <SelectField
                          label={dictionary.form.preferredContactMethod}
                          value={form.preferredContactMethod}
                          options={dictionary.options.contact}
                          onChange={(value) => updateField("preferredContactMethod", value as PreferredContactMethod)}
                        />
                        <TextField
                          label={dictionary.form.plannedAllocationAmount}
                          value={form.plannedAllocationAmount}
                          error={errors.plannedAllocationAmount}
                          onChange={(value) => updateField("plannedAllocationAmount", value)}
                          placeholder="$5,000+"
                          inputMode="decimal"
                        />
                        <SelectField
                          label={dictionary.form.preferredDepositMethod}
                          value={form.preferredDepositMethod}
                          options={dictionary.options.deposit}
                          onChange={(value) => updateField("preferredDepositMethod", value as PreferredDepositMethod)}
                        />
                        <SelectField
                          label={dictionary.form.investorType}
                          value={form.investorType}
                          options={dictionary.options.investorType}
                          onChange={(value) => updateField("investorType", value as InvestorType)}
                        />
                        <SelectField
                          label={dictionary.form.reinvestInterest}
                          value={form.reinvestInterest}
                          options={dictionary.options.reinvest}
                          onChange={(value) => updateField("reinvestInterest", value as ReinvestInterest)}
                        />
                        <TextField label={dictionary.form.heardFrom} value={form.heardFrom} error={errors.heardFrom} onChange={(value) => updateField("heardFrom", value)} />
                      </div>
                      <TextAreaField label={dictionary.form.message} value={form.message} onChange={(value) => updateField("message", value)} />
                      <TextField
                        label={dictionary.form.promoCode}
                        value={form.promoCode ?? ""}
                        error={errors.promoCode}
                        onChange={(value) => updateField("promoCode", value)}
                        placeholder={dictionary.form.promoCodePlaceholder}
                      />
                      <label className="flex gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/[0.035]">
                        <input
                          type="checkbox"
                          checked={form.consent}
                          onChange={(event) => updateField("consent", event.target.checked)}
                          className="mt-1 size-4 rounded border-border bg-background accent-[#d4af5f] dark:border-white/20 dark:bg-black"
                        />
                        <span>
                          {dictionary.form.consent}
                          {errors.consent ? <span className="mt-2 block text-amber-700 dark:text-gold-100">{errors.consent}</span> : null}
                        </span>
                      </label>
                      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? dictionary.form.submitting : dictionary.form.submit}
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
              <ApplyFAQ dictionary={dictionary} />
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustSidebar({ dictionary }: { dictionary: ApplyDictionary }) {
  return (
    <Card className="mt-8 bg-muted/30 dark:bg-white/[0.04]">
      <CardHeader>
        <CardTitle>{dictionary.sidebar.title}</CardTitle>
        <CardDescription>{dictionary.sidebar.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="size-4 text-amber-700 dark:text-gold-100" />
            {dictionary.sidebar.trustTitle}
          </div>
          <div className="grid gap-3">
            {dictionary.trustSignals.map((signal) => (
              <div key={signal} className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 p-4">
                <span className="text-sm text-foreground">{signal}</span>
                <CheckCircle2 className="size-4 text-amber-700 dark:text-gold-100" />
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileCheck2 className="size-4 text-amber-700 dark:text-gold-100" />
            {dictionary.sidebar.stepsTitle}
          </div>
          <div className="grid gap-2">
            {dictionary.flowSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-full bg-gold-300/20 dark:bg-gold-200/10 text-[0.65rem] font-semibold text-amber-700 dark:text-gold-100">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessState({ dictionary, receivedId, onReset }: { dictionary: ApplyDictionary; receivedId: string; onReset: () => void }) {
  return (
    <div className="rounded-[1.35rem] border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-7 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-200 text-graphite-950">
        <Mail className="size-6" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-foreground">{dictionary.form.successTitle}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">{dictionary.form.successMessage}</p>
      <p className="mt-5 text-xs text-muted-foreground">Reference: {receivedId}</p>
      <Button type="button" variant="outline" className="mt-7" onClick={onReset}>
        {dictionary.form.startAnother}
      </Button>
    </div>
  );
}

function ApplyFAQ({ dictionary }: { dictionary: ApplyDictionary }) {
  return (
    <Card className="mt-6 rounded-[1.35rem] bg-muted/30 dark:bg-white/[0.035]">
      <CardHeader>
        <CardTitle>{dictionary.faq.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          {dictionary.faq.items.map((item, index) => (
            <AccordionItem key={item.question} value={`apply-faq-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="h-[3.25rem] rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15"
      />
      {error ? <span className="text-xs text-amber-700 dark:text-gold-100">{error}</span> : null}
    </label>
  );
}

function CountrySelect({
  label,
  value,
  error,
  options,
  onSelect
}: {
  label: string;
  value: string;
  error?: string;
  options: CountryOption[];
  onSelect: (name: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState<string | null>(null);

  // While the user is actively typing (query !== null) the input shows the
  // filter text; otherwise it mirrors the currently selected country name.
  const inputValue = query ?? value;

  const filtered = React.useMemo(() => {
    if (query === null || query.trim() === "") {
      return options;
    }
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.name.toLowerCase().includes(needle));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleSelect(name: string) {
    onSelect(name);
    setQuery(null);
    setOpen(false);
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div ref={containerRef} className="relative">
        <input
          aria-label={label}
          value={inputValue}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setQuery(null);
            }
          }}
          autoComplete="off"
          className="h-[3.25rem] w-full rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15"
        />
        {open ? (
          <div className="absolute z-20 mt-2 max-h-[15rem] w-full overflow-y-auto rounded-2xl border border-border bg-popover shadow-premium dark:border-white/10 dark:bg-graphite-900">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.name)}
                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/50 dark:hover:bg-white/[0.06]"
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">—</div>
            )}
          </div>
        ) : null}
      </div>
      {error ? <span className="text-xs text-amber-700 dark:text-gold-100">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[3.25rem] rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15"
      >
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue} className="bg-card text-foreground dark:bg-graphite-900">
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <textarea
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="resize-none rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15"
      />
    </label>
  );
}

function FormNotice({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">
      <LockKeyhole className="size-4" />
      {message}
    </div>
  );
}
