import { isLocale, type Locale } from "@otiz/lib";
import { AdminHeader } from "@/components/admin/admin-header";

// Shared admin chrome: one sticky header (home link · nav pills · logout) for
// every admin page. The header hides itself on /admin/login and
// /admin/setup-2fa, so this layout can safely wrap the whole segment.
export default async function AdminLayout(props: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const params = await props.params;

  const {
    children
  } = props;

  const locale: Locale = isLocale(params.locale) ? params.locale : "en";

  return (
    <>
      <AdminHeader locale={locale} />
      {children}
    </>
  );
}
