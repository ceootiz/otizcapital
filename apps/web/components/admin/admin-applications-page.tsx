"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BellRing, CalendarClock, CheckCircle2, Clock3, Download, FileText, Save, Search, Sparkles, UserPlus, Users } from "lucide-react";
import {
  APPLICATION_SLA_FILTERS,
  DEFAULT_CRM_CONFIG,
  createAdminFormatters,
  enumLabel,
  getApplicationPriorityReasons,
  getApplicationSlaState,
  getCrmViews,
  priorityReasonLabel,
  slaBadgeLabel,
  type AdminFormatters,
  type ApplicationPriorityReason,
  type CrmConfig,
  type ApplicationSlaFilter,
  type ApplicationSlaState,
  type Locale
} from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog, Separator } from "@otiz/ui";
import { getCrmView, getCrmViewKey, type CrmViewKey } from "./crm-views";

const APPLICATION_STATUSES = ["NEW", "REVIEWED", "APPROVED", "REJECTED", "CONTACTED"] as const;
const APPLICATION_PRIORITIES = ["LOW", "NORMAL", "HIGH", "VIP"] as const;
const REINVEST_INTEREST_OPTIONS = ["yes", "no", "not_sure"] as const;
const INVESTOR_APPLICATION_SORT_OPTIONS = ["smart", "newest", "oldest", "amount-desc", "next-action"] as const;
const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const PAGE_SIZE = 10;

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];
type ReinvestInterest = (typeof REINVEST_INTEREST_OPTIONS)[number];
type InvestorApplicationSort = (typeof INVESTOR_APPLICATION_SORT_OPTIONS)[number];

type AdminApplication = {
  id: string;
  investorId: string | null;
  investor: AdminLinkedInvestor | null;
  fullName: string;
  telegram: string | null;
  email: string | null;
  country: string;
  preferredContactMethod: string;
  plannedAllocationAmount: number;
  preferredDepositMethod: string;
  investorType: string;
  reinvestInterest: string;
  heardFrom: string;
  message: string | null;
  consentAccepted: boolean;
  status: ApplicationStatus;
  managerNotes: string | null;
  priority: ApplicationPriority;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  contactedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminLinkedInvestor = {
  id: string;
  fullName: string;
  email: string;
  telegram: string | null;
  status: string;
  totalCapital: string;
  reinvestEnabled: boolean;
};

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
};

type NotificationEvent = {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  entityType: string;
  entityId: string;
  payloadJson: string;
  status: string;
  error: string | null;
  messagePreview: {
    subject: string;
    text: string;
    html?: string;
    telegramText?: string;
  } | null;
  createdAt: string;
  processedAt: string | null;
};

type PageInfo = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CrmSummary = {
  newLeads: number;
  contacted: number;
  approved: number;
  highVipPriority: number;
  overdueNextActions: number;
  plannedAllocationTotal: number;
};

type QueueCounts = Partial<Record<CrmViewKey, number>>;
type SlaCounts = Partial<Record<ApplicationSlaFilter, number>>;

type QueueCountsPayload = {
  views: QueueCounts;
  sla: SlaCounts;
  config: CrmConfig;
};

type ApiListResponse = {
  ok: boolean;
  data?: AdminApplication[];
  pageInfo?: PageInfo;
  summary?: CrmSummary;
  error?: string;
};

type ApiQueueCountsResponse = {
  ok: boolean;
  data?: QueueCountsPayload;
  error?: string;
};

type ApiAuditResponse = {
  ok: boolean;
  data?: AuditLog[];
  error?: string;
};

type ApiNotificationEventsResponse = {
  ok: boolean;
  data?: NotificationEvent[];
  error?: string;
};

type NotificationSummary = {
  counts: Record<"PENDING" | "SKIPPED" | "SENT" | "FAILED", number>;
  deliveryEnabled: boolean;
};

type ProcessNotificationsResult = {
  processed: number;
  skipped: number;
  failed: number;
  deliveryEnabled: boolean;
};

type ApiNotificationSummaryResponse = {
  ok: boolean;
  data?: NotificationSummary;
  error?: string;
};

type ApiProcessNotificationsResponse = {
  ok: boolean;
  data?: ProcessNotificationsResult;
  error?: string;
};

type ApiCreateInvestorResponse = {
  ok: boolean;
  created?: boolean;
  credentials?: InvestorAccessCredentials | null;
  data?: {
    investor: AdminLinkedInvestor;
    application: AdminApplication;
  };
  error?: string;
};

type InvestorAccessCredentials = {
  email: string;
  accessCode: string;
  loginPath: string;
};

type CreateInvestorResult = {
  application: AdminApplication;
  credentials: InvestorAccessCredentials | null;
};

type CrmDraft = {
  priority: ApplicationPriority;
  sourceLabel: string;
  managerNotes: string;
  nextAction: string;
  nextActionAt: string;
};

type ApplicationPatchPayload = Partial<{
  status: ApplicationStatus;
  priority: ApplicationPriority;
  managerNotes: string | null;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
}>;

type ActivityItem = {
  key: string;
  label: string;
  detail: string;
  at: string;
};

type AuditSnapshot = Partial<{
  status: string;
  priority: string;
  managerNotes: string | null;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  contactedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
}>;

const statuses: Array<"ALL" | ApplicationStatus> = ["ALL", ...APPLICATION_STATUSES];
const priorityOptions: Array<"ALL" | ApplicationPriority> = ["ALL", ...APPLICATION_PRIORITIES];
const reinvestInterestOptions: Array<"ALL" | ReinvestInterest> = ["ALL", ...REINVEST_INTEREST_OPTIONS];
const SLA_QUICK_FILTER_KEYS: ApplicationSlaFilter[] = ["first-contact-overdue", "due-soon", "high-value-no-contact"];
const defaultPageInfo: PageInfo = {
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};
const defaultSummary: CrmSummary = {
  newLeads: 0,
  contacted: 0,
  approved: 0,
  highVipPriority: 0,
  overdueNextActions: 0,
  plannedAllocationTotal: 0
};
const defaultNotificationSummary: NotificationSummary = {
  counts: {
    PENDING: 0,
    SKIPPED: 0,
    SENT: 0,
    FAILED: 0
  },
  deliveryEnabled: false
};
const STRINGS = {
  en: {
    backToHome: "Back to homepage",
    logout: "Logout",
    adminAccessProtected: "Admin access protected",
    adminAccessDesc: "CRM actions use the signed admin session, CSRF-protected mutations, pagination, CSV export, and audit logging.",
    summaryFirstContactOverdue: "First contact overdue",
    summaryDueSoon: "Due soon",
    summaryOverdue: "Overdue",
    summaryHighValueNoContact: "High value no contact",
    summaryNewLeads: "New leads",
    summaryContacted: "Contacted",
    summaryApproved: "Approved",
    summaryHighVip: "High/VIP priority",
    summaryOverdueNextActions: "Overdue next actions",
    summaryPlannedAllocationTotal: "Planned allocation total",
    investorApplications: "Investor applications",
    queueSubtitle: "Compact CRM queue for review, prioritization, and follow-up.",
    totalSuffix: "total",
    exportCsv: "Export CSV",
    slaDescFirstContact: "New leads waiting 24h+",
    slaDescDueSoon: "Next 24 hours",
    slaDescHighValue: "$25k+ untouched",
    searchAria: "Search applications",
    searchPlaceholder: "Search name, email, Telegram, country",
    filterByStatus: "Filter by status",
    filterByPriority: "Filter by priority",
    filterByReinvest: "Filter by reinvest interest",
    smartPriorityHelp: "Smart priority raises overdue actions, first-contact SLA breaches, high-value no-contact leads, due-soon actions, and VIP/High priority leads.",
    searchSourceAria: "Search by source label",
    searchSourcePlaceholder: "Search source label",
    overdueCheckboxAria: "Show overdue next actions",
    overdueNextActions: "Overdue next actions",
    reset: "Reset",
    all: "All",
    colLead: "Lead",
    colPriority: "Priority",
    colStatus: "Status",
    colAmount: "Amount",
    colSource: "Source",
    colNextAction: "Next action",
    colCreated: "Created",
    loadingApplications: "Loading applications",
    loadingApplicationsDesc: "Fetching the current CRM queue.",
    noMatching: "No matching applications",
    noApplications: "No applications yet",
    noMatchingDesc: "Try clearing filters or broadening the search.",
    noApplicationsDesc: "New investor applications will appear here after submission.",
    noNextActionShort: "No next action",
    pageLabel: "Page",
    ofLabel: "of",
    shownLabel: "shown",
    previous: "Previous",
    next: "Next",
    ruleFirstContactSla: "First contact SLA",
    ruleDueSoonWindow: "Due soon window",
    ruleHighValueThreshold: "High value threshold",
    ruleStaleLeadThreshold: "Stale lead threshold",
    hoursSuffix: "h",
    daysSuffix: "d",
    notificationWorker: "Notification worker",
    notificationWorkerDescEnabled: "Pending events are processed locally. Outbound delivery is enabled but provider delivery is not implemented.",
    notificationWorkerDescDisabled: "Pending events are processed locally. Outbound delivery is disabled.",
    processedLabel: "Processed",
    pendingSuffix: "pending",
    skippedSuffix: "skipped",
    sentSuffix: "sent",
    failedSuffix: "failed",
    processing: "Processing...",
    processPending: "Process pending notifications",
    loadingQueueCount: "Loading queue count",
    sortAria: "Sort applications",
    selectApplication: "Select an application",
    selectApplicationDesc: "Application details, quick actions, and timeline will appear here.",
    whyPrioritized: "Why this lead is prioritized",
    noUrgentSignals: "No urgent priority signals.",
    investorLinked: "Investor linked",
    capitalProfile: "Capital profile:",
    reinvestWord: "Reinvest",
    enabledWord: "enabled",
    disabledWord: "disabled",
    investorAccount: "Investor account",
    approveBeforeCreate: "Approve application before creating investor access.",
    createInvestorProfileDesc: "Create a protected investor profile from this approved application.",
    creating: "Creating...",
    createInvestorAccount: "Create investor account",
    showAccessDetails: "Show first-login details",
    accessDetailsTitle: "First login",
    accessCodeLabel: "Personal access code",
    accessDetailsHelp: "Send these details to the investor. After signing in, the investor creates a personal password.",
    copyLoginInstructions: "Copy login instructions",
    loginInstructionsCopied: "Instructions copied",
    emailRequired: "Email is required for investor login access.",
    slaIndicators: "SLA indicators",
    noActiveSla: "No active SLA flags for this application.",
    quickActions: "Quick actions",
    markContacted: "Mark contacted",
    approve: "Approve",
    reject: "Reject",
    setVip: "Set VIP",
    clearNextAction: "Clear next action",
    markedContacted: "Marked as contacted.",
    applicationApproved: "Application approved.",
    applicationRejected: "Application rejected.",
    confirmApproveTitle: "Approve application?",
    confirmApproveDesc: "The application will be approved. You can then create the investor account.",
    confirmRejectTitle: "Reject application?",
    confirmRejectDesc: "The application will be rejected and the applicant may be notified. This cannot be undone.",
    dialogBack: "Cancel",
    pendingWithdrawalsWidget: "{n} request(s) awaiting payout for {amount}",
    prioritySetVip: "Priority set to VIP.",
    nextActionCleared: "Next action cleared.",
    priorityLabel: "Priority",
    sourceLabelField: "Source label",
    sourcePlaceholder: "Creator, partner, referral",
    nextActionField: "Next action",
    nextActionPlaceholder: "Call, document review, approval prep",
    nextActionDateTime: "Next action date/time",
    managerNotes: "Manager notes",
    managerNotesPlaceholder: "Internal review notes, follow-up context, allocation fit.",
    unsavedChanges: "Unsaved CRM changes",
    fieldsUpToDate: "CRM fields are up to date",
    saving: "Saving...",
    saveCrmFields: "Save CRM fields",
    crmFieldsSaved: "CRM fields saved.",
    unableSaveCrm: "Unable to save CRM fields.",
    unableQuickAction: "Unable to run quick action.",
    investorLinkedNotice: "Investor account is linked to this approved application.",
    contact: "Contact",
    noEmail: "No email",
    noTelegram: "No Telegram",
    country: "Country",
    plannedAllocation: "Planned allocation",
    depositMethod: "Deposit method",
    investorType: "Investor type",
    reinvestInterestLabel: "Reinvest interest",
    contactedAt: "Contacted at",
    approvedAt: "Approved at",
    applicationMessage: "Application message",
    noNotesProvided: "No notes provided.",
    activityTimeline: "Application activity timeline",
    noActivity: "No activity yet",
    noActivityDesc: "Application lifecycle events will appear here.",
    notificationEvents: "Notification events",
    noNotificationEvents: "No notification events yet",
    noNotificationEventsDesc: "Internal email, Telegram, or operator notification events will appear here when they are queued.",
    telegramPreview: "Telegram preview",
    recipient: "Recipient",
    recentAuditHistory: "Recent audit history",
    noAuditHistory: "No audit history yet",
    noAuditHistoryDesc: "Status, priority, notes, source, and next action updates will appear here.",
    byWord: "by",
    noNextActionDesc: "Set a follow-up step and due date when this lead needs operator attention.",
    noActionTextSet: "No action text set.",
    overdueWord: "Overdue",
    unableLoadApplications: "Unable to load applications.",
    unableLoadQueueCounts: "Unable to load queue counts.",
    unableLoadNotificationSummary: "Unable to load notification summary.",
    unableUpdate: "Unable to update application.",
    unableProcessNotifications: "Unable to process notifications.",
    unableCreateInvestor: "Unable to create investor account.",
    unableLogout: "Unable to log out.",
    applicationChangesSaved: "Application changes saved.",
    investorCreatedLinked: "Investor account created and linked.",
    investorExistingLinked: "Existing investor account linked.",
    tlCreated: "Application created",
    tlSubmittedSuffix: "submitted an investor application.",
    tlContacted: "Contacted timestamp set",
    tlContactedDetail: "Lead has been marked as contacted.",
    tlApproved: "Approved timestamp set",
    tlApprovedDetail: "Lead has been approved.",
    tlRejected: "Rejected timestamp set",
    tlRejectedDetail: "Lead has been rejected.",
    tlStatusChanged: "Status changed",
    tlStatusUpdated: "Status updated.",
    tlPriorityChanged: "Priority changed",
    tlPriorityUpdated: "Priority updated.",
    tlNotesUpdated: "Notes updated",
    tlNotesUpdatedDetail: "Manager notes updated.",
    tlNotesClearedDetail: "Manager notes cleared.",
    tlSourceUpdated: "Source label updated",
    tlSourceUpdatedDetail: "Source label updated.",
    tlNextActionSet: "Next action set",
    tlNextActionCleared: "Next action cleared",
    tlNextActionFallback: "Next action",
    tlNoNextActionScheduled: "No next action scheduled.",
    tlByDate: "by",
    emptyWord: "empty",
    ntfInvestorApplication: "Investor application",
    ntfEnteredQueueSuffix: "entered the internal notification queue.",
    ntfPrevious: "previous",
    ntfUpdated: "updated",
    ntfInternalEvent: "Internal {channel} event for {entity}."
  },
  ru: {
    backToHome: "На главную",
    logout: "Выйти",
    adminAccessProtected: "Доступ администратора защищён",
    adminAccessDesc: "Действия CRM используют подписанную админ-сессию, защищённые от CSRF мутации, пагинацию, экспорт CSV и журнал аудита.",
    summaryFirstContactOverdue: "Просрочен первый контакт",
    summaryDueSoon: "Скоро срок",
    summaryOverdue: "Просрочено",
    summaryHighValueNoContact: "Крупный лид без контакта",
    summaryNewLeads: "Новые лиды",
    summaryContacted: "Связались",
    summaryApproved: "Одобрены",
    summaryHighVip: "Высокий/VIP приоритет",
    summaryOverdueNextActions: "Просроченные следующие действия",
    summaryPlannedAllocationTotal: "Планируемая аллокация всего",
    investorApplications: "Заявки инвесторов",
    queueSubtitle: "Компактная очередь CRM для проверки, приоритизации и работы с лидами.",
    totalSuffix: "всего",
    exportCsv: "Экспорт CSV",
    slaDescFirstContact: "Новые лиды ждут 24ч+",
    slaDescDueSoon: "Ближайшие 24 часа",
    slaDescHighValue: "$25k+ без работы",
    searchAria: "Поиск заявок",
    searchPlaceholder: "Поиск по имени, email, Telegram, стране",
    filterByStatus: "Фильтр по статусу",
    filterByPriority: "Фильтр по приоритету",
    filterByReinvest: "Фильтр по интересу к реинвесту",
    smartPriorityHelp: "Умный приоритет поднимает просроченные действия, нарушения SLA первого контакта, крупных лидов без контакта, действия с близким сроком и лидов с приоритетом VIP/Высокий.",
    searchSourceAria: "Поиск по источнику",
    searchSourcePlaceholder: "Поиск по метке источника",
    overdueCheckboxAria: "Показать просроченные следующие действия",
    overdueNextActions: "Просроченные следующие действия",
    reset: "Сбросить",
    all: "Все",
    colLead: "Лид",
    colPriority: "Приоритет",
    colStatus: "Статус",
    colAmount: "Сумма",
    colSource: "Источник",
    colNextAction: "Следующее действие",
    colCreated: "Создано",
    loadingApplications: "Загрузка заявок",
    loadingApplicationsDesc: "Загружаем текущую очередь CRM.",
    noMatching: "Нет подходящих заявок",
    noApplications: "Пока нет заявок",
    noMatchingDesc: "Попробуйте сбросить фильтры или расширить поиск.",
    noApplicationsDesc: "Новые заявки инвесторов появятся здесь после отправки.",
    noNextActionShort: "Нет следующего действия",
    pageLabel: "Страница",
    ofLabel: "из",
    shownLabel: "показано",
    previous: "Назад",
    next: "Далее",
    ruleFirstContactSla: "SLA первого контакта",
    ruleDueSoonWindow: "Окно «скоро срок»",
    ruleHighValueThreshold: "Порог крупного лида",
    ruleStaleLeadThreshold: "Порог залежавшегося лида",
    hoursSuffix: "ч",
    daysSuffix: "д",
    notificationWorker: "Обработчик уведомлений",
    notificationWorkerDescEnabled: "Ожидающие события обрабатываются локально. Исходящая доставка включена, но доставка через провайдера не реализована.",
    notificationWorkerDescDisabled: "Ожидающие события обрабатываются локально. Исходящая доставка отключена.",
    processedLabel: "Обработано",
    pendingSuffix: "в ожидании",
    skippedSuffix: "пропущено",
    sentSuffix: "отправлено",
    failedSuffix: "ошибок",
    processing: "Обработка...",
    processPending: "Обработать ожидающие уведомления",
    loadingQueueCount: "Загрузка счётчика очереди",
    sortAria: "Сортировка заявок",
    selectApplication: "Выберите заявку",
    selectApplicationDesc: "Здесь появятся детали заявки, быстрые действия и хронология.",
    whyPrioritized: "Почему этот лид в приоритете",
    noUrgentSignals: "Нет срочных сигналов приоритета.",
    investorLinked: "Инвестор привязан",
    capitalProfile: "Профиль капитала:",
    reinvestWord: "Реинвест",
    enabledWord: "включён",
    disabledWord: "отключён",
    investorAccount: "Аккаунт инвестора",
    approveBeforeCreate: "Одобрите заявку перед созданием доступа инвестора.",
    createInvestorProfileDesc: "Создайте защищённый профиль инвестора из этой одобренной заявки.",
    creating: "Создание...",
    createInvestorAccount: "Создать аккаунт инвестора",
    showAccessDetails: "Показать данные первого входа",
    accessDetailsTitle: "Первый вход",
    accessCodeLabel: "Персональный код доступа",
    accessDetailsHelp: "Передайте эти данные инвестору. После входа инвестор создаст собственный пароль.",
    copyLoginInstructions: "Скопировать инструкцию для входа",
    loginInstructionsCopied: "Инструкция скопирована",
    emailRequired: "Для входа инвестора требуется email.",
    slaIndicators: "Индикаторы SLA",
    noActiveSla: "Нет активных флагов SLA для этой заявки.",
    quickActions: "Быстрые действия",
    markContacted: "Отметить контакт",
    approve: "Одобрить",
    reject: "Отклонить",
    setVip: "Сделать VIP",
    clearNextAction: "Очистить следующее действие",
    markedContacted: "Отмечено как «связались».",
    applicationApproved: "Заявка одобрена.",
    applicationRejected: "Заявка отклонена.",
    confirmApproveTitle: "Одобрить заявку?",
    confirmApproveDesc: "Заявка будет одобрена. После этого можно создать кабинет инвестора.",
    confirmRejectTitle: "Отклонить заявку?",
    confirmRejectDesc: "Заявка будет отклонена, заявитель может получить уведомление. Отменить нельзя.",
    dialogBack: "Отмена",
    pendingWithdrawalsWidget: "{n} запрос(ов) на вывод на сумму {amount}",
    prioritySetVip: "Приоритет установлен на VIP.",
    nextActionCleared: "Следующее действие очищено.",
    priorityLabel: "Приоритет",
    sourceLabelField: "Метка источника",
    sourcePlaceholder: "Автор, партнёр, реферал",
    nextActionField: "Следующее действие",
    nextActionPlaceholder: "Звонок, проверка документов, подготовка к одобрению",
    nextActionDateTime: "Дата/время следующего действия",
    managerNotes: "Заметки менеджера",
    managerNotesPlaceholder: "Внутренние заметки, контекст по работе с лидом, соответствие аллокации.",
    unsavedChanges: "Несохранённые изменения CRM",
    fieldsUpToDate: "Поля CRM актуальны",
    saving: "Сохранение...",
    saveCrmFields: "Сохранить поля CRM",
    crmFieldsSaved: "Поля CRM сохранены.",
    unableSaveCrm: "Не удалось сохранить поля CRM.",
    unableQuickAction: "Не удалось выполнить быстрое действие.",
    investorLinkedNotice: "Аккаунт инвестора привязан к этой одобренной заявке.",
    contact: "Контакт",
    noEmail: "Нет email",
    noTelegram: "Нет Telegram",
    country: "Страна",
    plannedAllocation: "Планируемая аллокация",
    depositMethod: "Способ депозита",
    investorType: "Тип инвестора",
    reinvestInterestLabel: "Интерес к реинвесту",
    contactedAt: "Дата контакта",
    approvedAt: "Дата одобрения",
    applicationMessage: "Сообщение заявки",
    noNotesProvided: "Заметки не указаны.",
    activityTimeline: "Хронология активности заявки",
    noActivity: "Пока нет активности",
    noActivityDesc: "События жизненного цикла заявки появятся здесь.",
    notificationEvents: "События уведомлений",
    noNotificationEvents: "Пока нет событий уведомлений",
    noNotificationEventsDesc: "Внутренние события email, Telegram или уведомлений оператора появятся здесь после постановки в очередь.",
    telegramPreview: "Предпросмотр Telegram",
    recipient: "Получатель",
    recentAuditHistory: "Недавняя история аудита",
    noAuditHistory: "Пока нет истории аудита",
    noAuditHistoryDesc: "Здесь появятся изменения статуса, приоритета, заметок, источника и следующего действия.",
    byWord: "автор",
    noNextActionDesc: "Задайте шаг и срок, когда этому лиду нужно внимание оператора.",
    noActionTextSet: "Текст действия не задан.",
    overdueWord: "Просрочено",
    unableLoadApplications: "Не удалось загрузить заявки.",
    unableLoadQueueCounts: "Не удалось загрузить счётчики очереди.",
    unableLoadNotificationSummary: "Не удалось загрузить сводку уведомлений.",
    unableUpdate: "Не удалось обновить заявку.",
    unableProcessNotifications: "Не удалось обработать уведомления.",
    unableCreateInvestor: "Не удалось создать аккаунт инвестора.",
    unableLogout: "Не удалось выйти.",
    applicationChangesSaved: "Изменения заявки сохранены.",
    investorCreatedLinked: "Аккаунт инвестора создан и привязан.",
    investorExistingLinked: "Существующий аккаунт инвестора привязан.",
    tlCreated: "Заявка создана",
    tlSubmittedSuffix: "отправил(а) заявку инвестора.",
    tlContacted: "Установлена отметка контакта",
    tlContactedDetail: "Лид отмечен как «связались».",
    tlApproved: "Установлена отметка одобрения",
    tlApprovedDetail: "Лид одобрен.",
    tlRejected: "Установлена отметка отклонения",
    tlRejectedDetail: "Лид отклонён.",
    tlStatusChanged: "Статус изменён",
    tlStatusUpdated: "Статус обновлён.",
    tlPriorityChanged: "Приоритет изменён",
    tlPriorityUpdated: "Приоритет обновлён.",
    tlNotesUpdated: "Заметки обновлены",
    tlNotesUpdatedDetail: "Заметки менеджера обновлены.",
    tlNotesClearedDetail: "Заметки менеджера очищены.",
    tlSourceUpdated: "Метка источника обновлена",
    tlSourceUpdatedDetail: "Метка источника обновлена.",
    tlNextActionSet: "Следующее действие задано",
    tlNextActionCleared: "Следующее действие очищено",
    tlNextActionFallback: "Следующее действие",
    tlNoNextActionScheduled: "Следующее действие не запланировано.",
    tlByDate: "к",
    emptyWord: "пусто",
    ntfInvestorApplication: "Заявка инвестора",
    ntfEnteredQueueSuffix: "добавлен(а) во внутреннюю очередь уведомлений.",
    ntfPrevious: "предыдущий",
    ntfUpdated: "обновлён",
    ntfInternalEvent: "Внутреннее {channel}-событие для {entity}."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";

  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

function getAdminMutationHeaders() {
  return {
    "Content-Type": "application/json",
    [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE)
  };
}

function formatInteger(value: number, f: AdminFormatters) {
  return f.number(value);
}

function formatMoney(value: number, f: AdminFormatters) {
  return f.currency(value);
}

function formatHours(value: number, f: AdminFormatters, t: Strings) {
  return `${f.number(value)}${t.hoursSuffix}`;
}

function formatDays(value: number, f: AdminFormatters, t: Strings) {
  return `${f.number(value)}${t.daysSuffix}`;
}

function formatOptionalCount(value: number | undefined, isLoading: boolean, hasError: boolean, f: AdminFormatters) {
  if (isLoading) return "...";
  if (hasError || typeof value !== "number") return "—";
  return f.number(value);
}

function formatDateTime(value: string | null, f: AdminFormatters) {
  return f.dateTime(value);
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

function isOverdue(value: string | null) {
  if (!value) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

function isStatusOption(value: string | null): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

function isPriorityOption(value: string | null): value is ApplicationPriority {
  return APPLICATION_PRIORITIES.includes(value as ApplicationPriority);
}

function isReinvestInterestOption(value: string | null): value is ReinvestInterest {
  return REINVEST_INTEREST_OPTIONS.includes(value as ReinvestInterest);
}

function isSlaFilterOption(value: string | null): value is ApplicationSlaFilter {
  return APPLICATION_SLA_FILTERS.includes(value as ApplicationSlaFilter);
}

function isSortOption(value: string | null): value is InvestorApplicationSort {
  return INVESTOR_APPLICATION_SORT_OPTIONS.includes(value as InvestorApplicationSort);
}

function parseInitialPage(value: string | null) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function parseAuditSnapshot(value: string | null): AuditSnapshot {
  if (!value) return {};

  try {
    return JSON.parse(value) as AuditSnapshot;
  } catch {
    return {};
  }
}

function parseNotificationPayload(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatNotificationLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatNotificationDetail(event: NotificationEvent, t: Strings) {
  if (event.messagePreview?.text) {
    return event.messagePreview.text;
  }

  const payload = parseNotificationPayload(event.payloadJson);

  if (event.type === "INVESTOR_APPLICATION_CREATED") {
    const fullName = typeof payload.fullName === "string" ? payload.fullName : t.ntfInvestorApplication;
    return `${fullName} ${t.ntfEnteredQueueSuffix}`;
  }

  if (event.type === "APPLICATION_STATUS_CHANGED") {
    const previousStatus = typeof payload.previousStatus === "string" ? payload.previousStatus : t.ntfPrevious;
    const status = typeof payload.status === "string" ? payload.status : t.ntfUpdated;
    return `${previousStatus} -> ${status}`;
  }

  return t.ntfInternalEvent.replace("{channel}", event.channel.toLowerCase()).replace("{entity}", event.entityType);
}

function getChangedFieldDetail(beforeValue: unknown, afterValue: unknown, fallback: string, t: Strings) {
  const before = beforeValue === null || beforeValue === undefined || beforeValue === "" ? t.emptyWord : String(beforeValue);
  const after = afterValue === null || afterValue === undefined || afterValue === "" ? t.emptyWord : String(afterValue);

  return before === after ? fallback : `${before} -> ${after}`;
}

function buildActivityTimeline(application: AdminApplication, auditLogs: AuditLog[], t: Strings, f: AdminFormatters) {
  const items: ActivityItem[] = [
    {
      key: "created",
      label: t.tlCreated,
      detail: `${application.fullName} ${t.tlSubmittedSuffix}`,
      at: application.createdAt
    }
  ];

  if (application.contactedAt) items.push({ key: "contacted", label: t.tlContacted, detail: t.tlContactedDetail, at: application.contactedAt });
  if (application.approvedAt) items.push({ key: "approved", label: t.tlApproved, detail: t.tlApprovedDetail, at: application.approvedAt });
  if (application.rejectedAt) items.push({ key: "rejected", label: t.tlRejected, detail: t.tlRejectedDetail, at: application.rejectedAt });

  for (const log of auditLogs) {
    const before = parseAuditSnapshot(log.beforeJson);
    const after = parseAuditSnapshot(log.afterJson);

    if (before.status !== after.status) {
      items.push({ key: `${log.id}-status`, label: t.tlStatusChanged, detail: getChangedFieldDetail(before.status, after.status, t.tlStatusUpdated, t), at: log.createdAt });
    }
    if (before.priority !== after.priority) {
      items.push({ key: `${log.id}-priority`, label: t.tlPriorityChanged, detail: getChangedFieldDetail(before.priority, after.priority, t.tlPriorityUpdated, t), at: log.createdAt });
    }
    if (before.managerNotes !== after.managerNotes) {
      items.push({ key: `${log.id}-notes`, label: t.tlNotesUpdated, detail: after.managerNotes ? t.tlNotesUpdatedDetail : t.tlNotesClearedDetail, at: log.createdAt });
    }
    if (before.sourceLabel !== after.sourceLabel) {
      items.push({ key: `${log.id}-source`, label: t.tlSourceUpdated, detail: getChangedFieldDetail(before.sourceLabel, after.sourceLabel, t.tlSourceUpdatedDetail, t), at: log.createdAt });
    }
    if (before.nextAction !== after.nextAction || before.nextActionAt !== after.nextActionAt) {
      const hasNextAction = Boolean(after.nextAction || after.nextActionAt);
      items.push({
        key: `${log.id}-next-action`,
        label: hasNextAction ? t.tlNextActionSet : t.tlNextActionCleared,
        detail: hasNextAction ? `${after.nextAction || t.tlNextActionFallback} ${after.nextActionAt ? `${t.tlByDate} ${formatDateTime(after.nextActionAt, f)}` : ""}`.trim() : t.tlNoNextActionScheduled,
        at: log.createdAt
      });
    }
  }

  return items.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

export function AdminApplicationsPage({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialViewKey = getCrmViewKey(searchParams.get("view"));
  const initialView = getCrmView(initialViewKey);
  const [activeView, setActiveView] = React.useState<CrmViewKey>(initialViewKey);
  const [status, setStatus] = React.useState<"ALL" | ApplicationStatus>(() => {
    const queryStatus = searchParams.get("status");
    if (isStatusOption(queryStatus)) return queryStatus;
    return initialView.filters.status ?? "ALL";
  });
  const [priority, setPriority] = React.useState<"ALL" | ApplicationPriority>(() => {
    const queryPriority = searchParams.get("priority");
    if (isPriorityOption(queryPriority)) return queryPriority;
    return initialView.filters.priority ?? "ALL";
  });
  const [reinvestInterest, setReinvestInterest] = React.useState<"ALL" | ReinvestInterest>(() => {
    const queryReinvestInterest = searchParams.get("reinvestInterest");
    if (isReinvestInterestOption(queryReinvestInterest)) return queryReinvestInterest;
    return initialView.filters.reinvestInterest ?? "ALL";
  });
  const [search, setSearch] = React.useState(() => searchParams.get("search") || "");
  const [sourceSearch, setSourceSearch] = React.useState(() => searchParams.get("source") || "");
  const [overdueOnly, setOverdueOnly] = React.useState(() => searchParams.get("overdueNextAction") === "true" || initialView.filters.overdueOnly === true);
  const [sort, setSort] = React.useState<InvestorApplicationSort>(() => {
    const querySort = searchParams.get("sort");
    return isSortOption(querySort) ? querySort : "smart";
  });
  const [slaFilter, setSlaFilter] = React.useState<"ALL" | ApplicationSlaFilter>(() => {
    const querySla = searchParams.get("sla");
    return isSlaFilterOption(querySla) ? querySla : "ALL";
  });
  const [page, setPage] = React.useState(() => parseInitialPage(searchParams.get("page")));
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [pageInfo, setPageInfo] = React.useState<PageInfo>(defaultPageInfo);
  const [summary, setSummary] = React.useState<CrmSummary>(defaultSummary);
  const [queueCounts, setQueueCounts] = React.useState<QueueCountsPayload | null>(null);
  const [applications, setApplications] = React.useState<AdminApplication[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [notificationEvents, setNotificationEvents] = React.useState<NotificationEvent[]>([]);
  const [notificationSummary, setNotificationSummary] = React.useState<NotificationSummary>(defaultNotificationSummary);
  const [notificationProcessResult, setNotificationProcessResult] = React.useState<ProcessNotificationsResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [areQueueCountsLoading, setAreQueueCountsLoading] = React.useState(true);
  const [isNotificationSummaryLoading, setIsNotificationSummaryLoading] = React.useState(true);
  const [isProcessingNotifications, setIsProcessingNotifications] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isCreatingInvestor, setIsCreatingInvestor] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [queueCountsError, setQueueCountsError] = React.useState<string | null>(null);
  const [notificationError, setNotificationError] = React.useState<string | null>(null);
  const crmConfig = queueCounts?.config ?? DEFAULT_CRM_CONFIG;
  const t = getStrings(locale);
  const f = React.useMemo(() => createAdminFormatters(locale), [locale]);

  const filterParams = React.useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (priority !== "ALL") params.set("priority", priority);
    if (reinvestInterest !== "ALL") params.set("reinvestInterest", reinvestInterest);
    if (search.trim()) params.set("search", search.trim());
    if (sourceSearch.trim()) params.set("source", sourceSearch.trim());
    if (overdueOnly) params.set("overdueNextAction", "true");
    if (slaFilter !== "ALL") params.set("sla", slaFilter);
    params.set("sort", sort);
    const activeWorkflow = getCrmView(activeView).filters.workflow;
    if (activeWorkflow) params.set("workflow", activeWorkflow);
    return params;
  }, [activeView, status, priority, reinvestInterest, search, sourceSearch, overdueOnly, slaFilter, sort]);

  React.useEffect(() => {
    const params = new URLSearchParams(filterParams);
    params.set("view", activeView);

    if (page > 1) params.set("page", String(page));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeView, filterParams, page, pathname, router]);

  React.useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(filterParams);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    setIsLoading(true);
    setError(null);

    fetch(`/api/investor-applications?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiListResponse;

        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.unableLoadApplications);

        const nextPageInfo = payload.pageInfo || defaultPageInfo;
        if (nextPageInfo.total > 0 && page > nextPageInfo.totalPages) {
          setPage(nextPageInfo.totalPages);
          return;
        }

        setApplications(payload.data);
        setPageInfo(nextPageInfo);
        setSummary(payload.summary || defaultSummary);
        setSelectedId((current) => {
          if (current && payload.data?.some((application) => application.id === current)) return current;
          return payload.data?.[0]?.id || null;
        });
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setApplications([]);
        setPageInfo(defaultPageInfo);
        setSummary(defaultSummary);
        setError(requestError instanceof Error ? requestError.message : t.unableLoadApplications);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [page, filterParams, refreshKey]);

  React.useEffect(() => {
    const controller = new AbortController();

    setAreQueueCountsLoading(true);
    setQueueCountsError(null);

    fetch("/api/investor-applications/queue-counts", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiQueueCountsResponse;

        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.unableLoadQueueCounts);

        setQueueCounts(payload.data);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setQueueCounts(null);
        setQueueCountsError(requestError instanceof Error ? requestError.message : t.unableLoadQueueCounts);
      })
      .finally(() => setAreQueueCountsLoading(false));

    return () => controller.abort();
  }, [refreshKey]);

  React.useEffect(() => {
    const controller = new AbortController();

    setIsNotificationSummaryLoading(true);
    setNotificationError(null);

    fetch("/api/notification-events/summary", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiNotificationSummaryResponse;

        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.unableLoadNotificationSummary);

        setNotificationSummary(payload.data);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setNotificationSummary(defaultNotificationSummary);
        setNotificationError(requestError instanceof Error ? requestError.message : t.unableLoadNotificationSummary);
      })
      .finally(() => setIsNotificationSummaryLoading(false));

    return () => controller.abort();
  }, [refreshKey]);

  const selectedApplication = React.useMemo(
    () => applications.find((application) => application.id === selectedId) || applications[0] || null,
    [applications, selectedId]
  );
  const selectedApplicationId = selectedApplication?.id || null;

  const hasActiveFilters =
    status !== "ALL" ||
    priority !== "ALL" ||
    reinvestInterest !== "ALL" ||
    slaFilter !== "ALL" ||
    Boolean(search.trim()) ||
    Boolean(sourceSearch.trim()) ||
    overdueOnly;

  const loadAuditLogs = React.useCallback(async (applicationId: string) => {
    const params = new URLSearchParams({ entityType: "InvestorApplication", entityId: applicationId });
    const response = await fetch(`/api/audit-logs?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiAuditResponse;

    setAuditLogs(response.ok && payload.ok && payload.data ? payload.data : []);
  }, []);

  const loadNotificationEvents = React.useCallback(async (applicationId: string) => {
    const params = new URLSearchParams({ entityType: "InvestorApplication", entityId: applicationId });
    const response = await fetch(`/api/notification-events?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiNotificationEventsResponse;

    setNotificationEvents(response.ok && payload.ok && payload.data ? payload.data : []);
  }, []);

  React.useEffect(() => {
    if (!selectedApplicationId) {
      setAuditLogs([]);
      setNotificationEvents([]);
      return;
    }

    void Promise.all([
      loadAuditLogs(selectedApplicationId).catch(() => setAuditLogs([])),
      loadNotificationEvents(selectedApplicationId).catch(() => setNotificationEvents([]))
    ]);
  }, [loadAuditLogs, loadNotificationEvents, selectedApplicationId]);

  // Logout moved to the shared AdminHeader (components/admin/admin-header.tsx).

  async function patchApplication(application: AdminApplication, payload: ApplicationPatchPayload, successMessage: string) {
    setIsUpdating(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investor-applications/${application.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: AdminApplication; error?: string };

      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || t.unableUpdate);

      setApplications((current) => current.map((item) => (item.id === responsePayload.data?.id ? responsePayload.data : item)));
      setNotice(successMessage);
      await Promise.all([loadAuditLogs(responsePayload.data.id), loadNotificationEvents(responsePayload.data.id)]);
      setRefreshKey((current) => current + 1);
      return responsePayload.data;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.unableUpdate);
      throw requestError;
    } finally {
      setIsUpdating(false);
    }
  }

  async function processPendingNotifications() {
    setIsProcessingNotifications(true);
    setNotificationError(null);
    setNotificationProcessResult(null);

    try {
      const response = await fetch("/api/admin/notifications/process", {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ limit: 25 })
      });
      const payload = (await response.json()) as ApiProcessNotificationsResponse;

      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.unableProcessNotifications);

      setNotificationProcessResult(payload.data);
      if (selectedApplication) await loadNotificationEvents(selectedApplication.id);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setNotificationError(requestError instanceof Error ? requestError.message : t.unableProcessNotifications);
    } finally {
      setIsProcessingNotifications(false);
    }
  }

  async function saveCrmDraft(application: AdminApplication, draft: CrmDraft) {
    return patchApplication(
      application,
      {
        priority: draft.priority,
        managerNotes: draft.managerNotes,
        sourceLabel: draft.sourceLabel,
        nextAction: draft.nextAction,
        nextActionAt: draft.nextActionAt || null
      },
      t.applicationChangesSaved
    );
  }

  async function createInvestorFromApplication(application: AdminApplication) {
    setIsCreatingInvestor(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/investors/from-application", {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ applicationId: application.id })
      });
      const payload = (await response.json()) as ApiCreateInvestorResponse;

      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.unableCreateInvestor);

      setApplications((current) => current.map((item) => (item.id === payload.data?.application.id ? payload.data.application : item)));
      setNotice(payload.created ? t.investorCreatedLinked : t.investorExistingLinked);
      await Promise.all([loadAuditLogs(payload.data.application.id), loadNotificationEvents(payload.data.application.id)]);
      setRefreshKey((current) => current + 1);
      return {
        application: payload.data.application,
        credentials: payload.credentials ?? null
      };
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.unableCreateInvestor);
      throw requestError;
    } finally {
      setIsCreatingInvestor(false);
    }
  }

  function resetFilters() {
    setActiveView("all");
    setStatus("ALL");
    setPriority("ALL");
    setReinvestInterest("ALL");
    setSearch("");
    setSourceSearch("");
    setOverdueOnly(false);
    setSlaFilter("ALL");
    setSort("smart");
    setPage(1);
  }

  function applySavedView(viewKey: CrmViewKey) {
    const view = getCrmView(viewKey);

    setActiveView(viewKey);
    setStatus(view.filters.status ?? "ALL");
    setPriority(view.filters.priority ?? "ALL");
    setReinvestInterest(view.filters.reinvestInterest ?? "ALL");
    setOverdueOnly(view.filters.overdueOnly === true);
    setSlaFilter("ALL");
    setSearch("");
    setSourceSearch("");
    setPage(1);
  }

  function exportCsv() {
    const params = new URLSearchParams(filterParams);
    const query = params.toString();
    const link = document.createElement("a");
    link.href = `/api/investor-applications/export.csv${query ? `?${query}` : ""}`;
    link.download = "otiz-investor-applications.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <CrmRulesCard config={crmConfig} locale={locale} />

          <NotificationProcessorPanel
            summary={notificationSummary}
            isLoading={isNotificationSummaryLoading}
            isProcessing={isProcessingNotifications}
            error={notificationError}
            result={notificationProcessResult}
            onProcess={processPendingNotifications}
            locale={locale}
          />

          <PendingWithdrawalsWidget locale={locale} template={t.pendingWithdrawalsWidget} />

          <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <SummaryCard label={t.summaryFirstContactOverdue} value={formatOptionalCount(queueCounts?.sla["first-contact-overdue"], areQueueCountsLoading, Boolean(queueCountsError), f)} />
            <SummaryCard label={t.summaryDueSoon} value={formatOptionalCount(queueCounts?.sla["due-soon"], areQueueCountsLoading, Boolean(queueCountsError), f)} />
            <SummaryCard label={t.summaryOverdue} value={formatOptionalCount(queueCounts?.sla.overdue, areQueueCountsLoading, Boolean(queueCountsError), f)} />
            <SummaryCard label={t.summaryHighValueNoContact} value={formatOptionalCount(queueCounts?.sla["high-value-no-contact"], areQueueCountsLoading, Boolean(queueCountsError), f)} />
            <SummaryCard label={t.summaryNewLeads} value={formatInteger(summary.newLeads, f)} />
            <SummaryCard label={t.summaryContacted} value={formatInteger(summary.contacted, f)} />
            <SummaryCard
              label={t.summaryApproved}
              value={formatOptionalCount(queueCounts?.views.approved, areQueueCountsLoading, Boolean(queueCountsError), f)}
            />
            <SummaryCard label={t.summaryHighVip} value={formatInteger(summary.highVipPriority, f)} />
            <SummaryCard label={t.summaryOverdueNextActions} value={formatInteger(summary.overdueNextActions, f)} />
            <SummaryCard label={t.summaryPlannedAllocationTotal} value={formatMoney(summary.plannedAllocationTotal, f)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(25rem,0.84fr)]">
            <Card className="overflow-hidden rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl">{t.investorApplications}</CardTitle>
                    <CardDescription>{t.queueSubtitle}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{pageInfo.total} {t.totalSuffix}</Badge>
                    <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
                      <Download data-icon="inline-start" />
                      {t.exportCsv}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {getCrmViews(locale).map((view) => {
                    const isActive = activeView === view.key;

                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => applySavedView(view.key)}
                        className={`rounded-2xl border p-3 text-left transition-colors ${
                          isActive
                            ? "border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 text-foreground"
                            : "border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/[0.05] hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="block text-sm font-semibold">{view.label}</span>
                          <QueueCountBadge value={queueCounts?.views[view.key]} isLoading={areQueueCountsLoading} hasError={Boolean(queueCountsError)} locale={locale} />
                        </span>
                        <span className="mt-1 block text-xs leading-5 opacity-75">{view.description}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mb-4 flex flex-wrap gap-2 rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/15 p-3">
                  {SLA_QUICK_FILTER_KEYS.map((filterKey) => {
                    const isActive = slaFilter === filterKey;
                    const description = filterKey === "first-contact-overdue" ? t.slaDescFirstContact : filterKey === "due-soon" ? t.slaDescDueSoon : t.slaDescHighValue;

                    return (
                      <button
                        key={filterKey}
                        type="button"
                        onClick={() => {
                          setSlaFilter((current) => (current === filterKey ? "ALL" : filterKey));
                          setPage(1);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                          isActive
                            ? "border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100"
                            : "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] text-muted-foreground hover:text-foreground"
                        }`}
                        title={description}
                      >
                        <span>{slaBadgeLabel(filterKey, locale)}</span>
                        <QueueCountBadge value={queueCounts?.sla[filterKey]} isLoading={areQueueCountsLoading} hasError={Boolean(queueCountsError)} locale={locale} />
                      </button>
                    );
                  })}
                </div>
                <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_11rem_11rem_13rem]">
                  <label className="flex h-12 items-center gap-3 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-muted-foreground">
                    <Search className="size-4" />
                    <input
                      aria-label={t.searchAria}
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                      placeholder={t.searchPlaceholder}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <CrmSelect label={t.filterByStatus} value={status} onChange={(value) => { setStatus(value as "ALL" | ApplicationStatus); setPage(1); }} options={statuses} renderOption={(value) => (value === "ALL" ? t.all : enumLabel("applicationStatus", value, locale))} />
                  <CrmSelect label={t.filterByPriority} value={priority} onChange={(value) => { setPriority(value as "ALL" | ApplicationPriority); setPage(1); }} options={priorityOptions} renderOption={(value) => (value === "ALL" ? t.all : enumLabel("applicationPriority", value, locale))} />
                  <div className="flex flex-col gap-2">
                    <SortSelect value={sort} onChange={(value) => { setSort(value); setPage(1); }} locale={locale} />
                    <p className="text-[0.68rem] leading-4 text-muted-foreground">
                      {t.smartPriorityHelp}
                    </p>
                  </div>
                </div>
                <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_12rem_15rem_8rem]">
                  <label className="flex h-12 items-center gap-3 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-muted-foreground">
                    <Search className="size-4" />
                    <input
                      aria-label={t.searchSourceAria}
                      value={sourceSearch}
                      onChange={(event) => { setSourceSearch(event.target.value); setPage(1); }}
                      placeholder={t.searchSourcePlaceholder}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <CrmSelect
                    label={t.filterByReinvest}
                    value={reinvestInterest}
                    onChange={(value) => {
                      setReinvestInterest(value as "ALL" | ReinvestInterest);
                      setPage(1);
                    }}
                    options={reinvestInterestOptions}
                    renderOption={(value) => (value === "ALL" ? t.all : enumLabel("reinvestInterest", value, locale))}
                  />
                  <label className="flex h-12 items-center gap-3 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-muted-foreground">
                    <input type="checkbox" checked={overdueOnly} onChange={(event) => { setOverdueOnly(event.target.checked); setPage(1); }} aria-label={t.overdueCheckboxAria} />
                    <span>{t.overdueNextActions}</span>
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="h-12">{t.reset}</Button>
                </div>

                {notice ? <AdminNotice tone="success" message={notice} /> : null}
                {error ? <AdminNotice tone="error" message={error} /> : null}

                <div className="overflow-hidden rounded-[1.35rem] border border-border dark:border-white/10">
                  <div className="hidden grid-cols-[1.2fr_0.62fr_0.7fr_0.72fr_0.88fr_0.9fr_0.86fr] gap-3 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.035] px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
                    <span>{t.colLead}</span>
                    <span>{t.colPriority}</span>
                    <span>{t.colStatus}</span>
                    <span>{t.colAmount}</span>
                    <span>{t.colSource}</span>
                    <span>{t.colNextAction}</span>
                    <span>{t.colCreated}</span>
                  </div>
                  {isLoading ? (
                    <QueueEmptyState title={t.loadingApplications} description={t.loadingApplicationsDesc} />
                  ) : applications.length === 0 ? (
                    <QueueEmptyState title={hasActiveFilters ? t.noMatching : t.noApplications} description={hasActiveFilters ? t.noMatchingDesc : t.noApplicationsDesc} />
                  ) : (
                    applications.map((application) => {
                      const slaState = getApplicationSlaState(application, { config: crmConfig });

                      return (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => setSelectedId(application.id)}
                          className={`grid w-full gap-3 border-b border-border dark:border-white/10 p-4 text-left transition-colors last:border-b-0 lg:grid-cols-[1.2fr_0.62fr_0.7fr_0.72fr_0.88fr_0.9fr_0.86fr] lg:items-center ${
                            selectedApplication?.id === application.id ? "bg-gold-300/20 dark:bg-gold-200/10" : "bg-muted/30 dark:bg-white/[0.02] hover:bg-muted/50 dark:hover:bg-white/[0.045]"
                          } ${application.priority === "VIP" ? "ring-1 ring-gold-200/20" : ""}`}
                        >
                          <span className="flex flex-col gap-2">
                            <span>
                              <span className="block font-semibold text-foreground">{application.fullName}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{application.email || application.telegram || application.country}</span>
                            </span>
                            <SlaBadges state={slaState} compact locale={locale} />
                          </span>
                          <span><PriorityBadge priority={application.priority} locale={locale} /></span>
                          <span><Badge variant={application.status === "NEW" ? "default" : "secondary"}>{enumLabel("applicationStatus", application.status, locale)}</Badge></span>
                          <span className="font-semibold text-foreground">{formatMoney(application.plannedAllocationAmount, f)}</span>
                          <span className="text-sm text-muted-foreground">{application.sourceLabel || "—"}</span>
                          <span className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <span>{application.nextAction || t.noNextActionShort}</span>
                            {application.nextActionAt ? <OverdueBadge value={application.nextActionAt} locale={locale} /> : null}
                          </span>
                          <span className="text-sm text-muted-foreground">{formatDateTime(application.createdAt, f)}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>{t.pageLabel} {pageInfo.page} {t.ofLabel} {pageInfo.totalPages} · {applications.length} {t.shownLabel} · {pageInfo.total} {t.totalSuffix}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={isLoading || !pageInfo.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t.previous}</Button>
                    <Button type="button" variant="outline" size="sm" disabled={isLoading || !pageInfo.hasNextPage} onClick={() => setPage((current) => current + 1)}>{t.next}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          <ApplicationDetail
            application={selectedApplication}
            auditLogs={auditLogs}
            notificationEvents={notificationEvents}
            isUpdating={isUpdating}
            isCreatingInvestor={isCreatingInvestor}
            onPatchApplication={patchApplication}
            onSaveCrmDraft={saveCrmDraft}
            onCreateInvestor={createInvestorFromApplication}
            crmConfig={crmConfig}
            locale={locale}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function CrmRulesCard({ config, locale }: { config: CrmConfig; locale: Locale }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);

  return (
    <Card className="mb-6 rounded-[1.35rem] border border-border dark:border-white/10 bg-card dark:bg-graphite-900/[0.58]">
      <CardContent className="grid gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
        <RuleMetric label={t.ruleFirstContactSla} value={formatHours(config.firstContactSlaHours, f, t)} />
        <RuleMetric label={t.ruleDueSoonWindow} value={formatHours(config.nextActionDueSoonHours, f, t)} />
        <RuleMetric label={t.ruleHighValueThreshold} value={formatMoney(config.highValueLeadAmount, f)} />
        <RuleMetric label={t.ruleStaleLeadThreshold} value={formatDays(config.staleLeadDays, f, t)} />
      </CardContent>
    </Card>
  );
}

function RuleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function NotificationProcessorPanel({
  summary,
  isLoading,
  isProcessing,
  error,
  result,
  onProcess,
  locale
}: {
  summary: NotificationSummary;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  result: ProcessNotificationsResult | null;
  onProcess: () => void;
  locale: Locale;
}) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);
  const pendingCount = summary.counts.PENDING;
  const isDisabled = isLoading || isProcessing || pendingCount === 0;

  return (
    <Card className="mb-6 rounded-[1.35rem] border border-border dark:border-white/10 bg-card dark:bg-graphite-900/[0.64]">
      <CardContent className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
            <BellRing className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{t.notificationWorker}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {summary.deliveryEnabled ? t.notificationWorkerDescEnabled : t.notificationWorkerDescDisabled}
            </p>
            {result ? (
              <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-gold-100">
                {t.processedLabel} {formatInteger(result.processed, f)} · {t.skippedSuffix} {formatInteger(result.skipped, f)} · {t.failedSuffix} {formatInteger(result.failed, f)}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-gold-100">{error}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{isLoading ? "..." : `${formatInteger(pendingCount, f)} ${t.pendingSuffix}`}</Badge>
          <Badge variant="secondary">{formatInteger(summary.counts.SKIPPED, f)} {t.skippedSuffix}</Badge>
          <Badge variant="secondary">{formatInteger(summary.counts.SENT, f)} {t.sentSuffix}</Badge>
          <Badge variant="secondary">{formatInteger(summary.counts.FAILED, f)} {t.failedSuffix}</Badge>
          <Button type="button" variant="outline" size="sm" disabled={isDisabled} onClick={onProcess}>
            {isProcessing ? t.processing : t.processPending}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.35rem] border border-border dark:border-white/10 bg-card dark:bg-graphite-900/[0.64]">
      <CardContent className="px-5 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function QueueCountBadge({ value, isLoading, hasError, locale }: { value: number | undefined; isLoading: boolean; hasError: boolean; locale: Locale }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);

  if (isLoading) {
    return <span aria-label={t.loadingQueueCount} className="h-5 w-9 rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.06] opacity-70 animate-pulse" />;
  }

  if (hasError || typeof value !== "number") {
    return <span className="rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] px-2 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">—</span>;
  }

  return <span className="rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.05] px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">{formatInteger(value, f)}</span>;
}

function CrmSelect({ label, value, options, onChange, renderOption }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; renderOption?: (value: string) => string }) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45">
      {options.map((option) => <option key={option} value={option} className="bg-card dark:bg-graphite-900 text-foreground">{renderOption ? renderOption(option) : option}</option>)}
    </select>
  );
}

function SortSelect({ value, onChange, locale }: { value: InvestorApplicationSort; onChange: (value: InvestorApplicationSort) => void; locale: Locale }) {
  const t = getStrings(locale);

  return (
    <select aria-label={t.sortAria} value={value} onChange={(event) => onChange(event.target.value as InvestorApplicationSort)} className="h-12 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45">
      {INVESTOR_APPLICATION_SORT_OPTIONS.map((option) => (
        <option key={option} value={option} className="bg-card dark:bg-graphite-900 text-foreground">{enumLabel("applicationSort", option, locale)}</option>
      ))}
    </select>
  );
}

function AdminNotice({ message, tone }: { message: string; tone: "success" | "error" }) {
  const toneClass = tone === "success" ? "border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100" : "border-red-300/20 bg-red-500/10 text-red-100";
  return <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm ${toneClass}`}><CheckCircle2 className="size-4" />{message}</div>;
}

// D4: dashboard widget summarizing pending withdrawals. Fetches its own summary
// and only renders when there is at least one pending request. Links to the
// withdrawals queue.
function PendingWithdrawalsWidget({ locale, template }: { locale: Locale; template: string }) {
  const f = createAdminFormatters(locale);
  const [summary, setSummary] = React.useState<{ count: number; total: number } | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/withdrawals/summary", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { ok: boolean; count?: number; total?: number }) => {
        if (payload.ok) setSummary({ count: payload.count ?? 0, total: payload.total ?? 0 });
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => controller.abort();
  }, []);

  if (!summary || summary.count <= 0) {
    return null;
  }

  const label = template
    .replace("{n}", String(summary.count))
    .replace("{amount}", f.currency(summary.total));

  return (
    <Link
      href={`/${locale}/admin/withdrawals`}
      className="mb-6 flex items-center justify-between gap-4 rounded-[1.35rem] border border-gold-200/30 bg-gold-300/20 dark:bg-gold-200/10 p-5 transition-colors hover:bg-gold-300/30 dark:hover:bg-gold-200/15"
    >
      <span className="flex items-center gap-3 text-sm font-semibold text-amber-700 dark:text-gold-100">
        <CalendarClock className="size-5" />
        {label}
      </span>
      <ArrowRight className="size-4 text-amber-700 dark:text-gold-100" />
    </Link>
  );
}

function PriorityBadge({ priority, locale }: { priority: ApplicationPriority; locale: Locale }) {
  const isElevated = priority === "VIP" || priority === "HIGH";
  return <Badge variant={isElevated ? "default" : "secondary"}>{enumLabel("applicationPriority", priority, locale)}</Badge>;
}

function OverdueBadge({ value, locale }: { value: string; locale: Locale }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);
  const overdue = isOverdue(value);
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] ${overdue ? "border-gold-200/30 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100" : "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] text-muted-foreground"}`}>
      <Clock3 className="size-3" />
      {overdue ? t.overdueWord : formatDateTime(value, f)}
    </span>
  );
}

function getSlaBadgeClass(tone: "attention" | "urgent" | "value") {
  if (tone === "urgent") return "border-gold-200/40 bg-gold-300/25 dark:bg-gold-200/14 text-amber-700 dark:text-gold-100";
  if (tone === "value") return "border-border dark:border-white/15 bg-muted/30 dark:bg-white/[0.06] text-foreground";
  return "border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/8 text-amber-700 dark:text-gold-100";
}

function getPriorityReasonClass(tone: ApplicationPriorityReason["tone"]) {
  if (tone === "urgent") return "border-gold-200/40 bg-gold-300/25 dark:bg-gold-200/14 text-amber-700 dark:text-gold-100";
  if (tone === "value") return "border-border dark:border-white/15 bg-muted/30 dark:bg-white/[0.06] text-foreground";
  if (tone === "attention") return "border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/8 text-amber-700 dark:text-gold-100";
  return "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] text-muted-foreground";
}

function SlaBadges({ state, compact = false, locale }: { state: ApplicationSlaState; compact?: boolean; locale: Locale }) {
  if (state.badges.length === 0) return null;

  return (
    <span className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-3"}`}>
      {state.badges.map((badge) => (
        <span key={badge.flag} className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-[0.68rem] font-semibold ${getSlaBadgeClass(badge.tone)}`}>
          {slaBadgeLabel(badge.filter, locale, compact)}
        </span>
      ))}
    </span>
  );
}

function PriorityReasonsPanel({ reasons, locale }: { reasons: ApplicationPriorityReason[]; locale: Locale }) {
  const t = getStrings(locale);

  return (
    <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.whyPrioritized}</p>
      {reasons.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span key={reason.key} className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityReasonClass(reason.tone)}`}>
              {priorityReasonLabel(reason, locale)}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.noUrgentSignals}</p>
      )}
    </div>
  );
}

function InvestorLinkPanel({
  application,
  credentials,
  isCreating,
  onCreate,
  locale
}: {
  application: AdminApplication;
  credentials: InvestorAccessCredentials | null;
  isCreating: boolean;
  onCreate: () => void;
  locale: Locale;
}) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);
  const [copied, setCopied] = React.useState(false);

  async function copyLoginInstructions() {
    if (!credentials) return;
    const loginUrl = `${window.location.origin}${credentials.loginPath}`;
    const instructions = `${t.accessDetailsTitle}\n${loginUrl}\nEmail: ${credentials.email}\n${t.accessCodeLabel}: ${credentials.accessCode}`;
    await navigator.clipboard.writeText(instructions);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  if (application.investor) {
    return (
      <div className="rounded-[1.35rem] border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-200/25 bg-muted/30 dark:bg-black/20 text-amber-700 dark:text-gold-100">
            <Users className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.investorLinked}</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{application.investor.fullName}</p>
            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{application.investor.email} · {enumLabel("investorStatus", application.investor.status, locale)}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t.capitalProfile} {formatMoney(Number(application.investor.totalCapital || 0), f)} · {t.reinvestWord} {application.investor.reinvestEnabled ? t.enabledWord : t.disabledWord}
            </p>
          </div>
        </div>
        {credentials ? (
          <div className="mt-4 rounded-[1rem] border border-gold-200/30 bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.accessDetailsTitle}</p>
            <p className="mt-3 break-all text-sm font-medium text-foreground">{credentials.email}</p>
            <p className="mt-3 text-xs text-muted-foreground">{t.accessCodeLabel}</p>
            <code className="mt-1 block break-all rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{credentials.accessCode}</code>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{t.accessDetailsHelp}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={copyLoginInstructions}>
              {copied ? t.loginInstructionsCopied : t.copyLoginInstructions}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" className="mt-4" disabled={isCreating} onClick={onCreate}>
            {isCreating ? t.creating : t.showAccessDetails}
          </Button>
        )}
      </div>
    );
  }

  if (application.status !== "APPROVED") {
    return (
      <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.investorAccount}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.approveBeforeCreate}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.investorAccount}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.createInvestorProfileDesc}</p>
        </div>
        <Button type="button" size="sm" disabled={isCreating || !application.email} onClick={onCreate}>
          <UserPlus data-icon="inline-start" />
          {isCreating ? t.creating : t.createInvestorAccount}
        </Button>
      </div>
      {!application.email ? <p className="mt-3 text-xs text-amber-700 dark:text-gold-100">{t.emailRequired}</p> : null}
    </div>
  );
}

function SlaIndicatorPanel({ state, locale }: { state: ApplicationSlaState; locale: Locale }) {
  const t = getStrings(locale);

  return (
    <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.slaIndicators}</p>
      {state.badges.length > 0 ? (
        <SlaBadges state={state} locale={locale} />
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.noActiveSla}</p>
      )}
    </div>
  );
}

function QueueEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
      <FileText className="size-8 text-amber-700 dark:text-gold-100" />
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ApplicationDetail({
  application,
  auditLogs,
  notificationEvents,
  isUpdating,
  isCreatingInvestor,
  onPatchApplication,
  onSaveCrmDraft,
  onCreateInvestor,
  crmConfig,
  locale
}: {
  application: AdminApplication | null;
  auditLogs: AuditLog[];
  notificationEvents: NotificationEvent[];
  isUpdating: boolean;
  isCreatingInvestor: boolean;
  onPatchApplication: (application: AdminApplication, payload: ApplicationPatchPayload, successMessage: string) => Promise<AdminApplication>;
  onSaveCrmDraft: (application: AdminApplication, draft: CrmDraft) => Promise<AdminApplication>;
  onCreateInvestor: (application: AdminApplication) => Promise<CreateInvestorResult>;
  crmConfig: CrmConfig;
  locale: Locale;
}) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);
  const [accessCredentials, setAccessCredentials] = React.useState<(InvestorAccessCredentials & { applicationId: string }) | null>(null);
  const [draft, setDraft] = React.useState<CrmDraft>({ priority: "NORMAL", sourceLabel: "", managerNotes: "", nextAction: "", nextActionAt: "" });
  const [detailNotice, setDetailNotice] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  // Approve/reject require confirmation before running (Block D1).
  const [confirmAction, setConfirmAction] = React.useState<"APPROVED" | "REJECTED" | null>(null);
  const draftDefaults = React.useMemo<CrmDraft | null>(() => {
    if (!application) return null;

    return {
      priority: application.priority,
      sourceLabel: application.sourceLabel || "",
      managerNotes: application.managerNotes || "",
      nextAction: application.nextAction || "",
      nextActionAt: toDateTimeInputValue(application.nextActionAt)
    };
  }, [application]);

  React.useEffect(() => {
    if (!draftDefaults) return;

    setDraft(draftDefaults);
    setDetailNotice(null);
    setDetailError(null);
  }, [draftDefaults]);

  if (!application) {
    return (
      <Card className="rounded-[1.35rem] bg-muted/30 dark:bg-white/[0.035]">
        <CardContent className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
          <FileText className="size-10 text-amber-700 dark:text-gold-100" />
          <p className="mt-5 font-semibold text-foreground">{t.selectApplication}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.selectApplicationDesc}</p>
        </CardContent>
      </Card>
    );
  }

  const isDirty = draft.priority !== application.priority || draft.sourceLabel !== (application.sourceLabel || "") || draft.managerNotes !== (application.managerNotes || "") || draft.nextAction !== (application.nextAction || "") || draft.nextActionAt !== toDateTimeInputValue(application.nextActionAt);
  const timeline = buildActivityTimeline(application, auditLogs, t, f);
  const slaState = getApplicationSlaState(application, { config: crmConfig });
  const priorityReasons = getApplicationPriorityReasons(application, crmConfig);

  async function saveDraft() {
    if (!application) return;
    setIsSaving(true);
    setDetailNotice(null);
    setDetailError(null);

    try {
      await onSaveCrmDraft(application, draft);
      setDetailNotice(t.crmFieldsSaved);
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : t.unableSaveCrm);
    } finally {
      setIsSaving(false);
    }
  }

  async function runQuickAction(payload: ApplicationPatchPayload, successMessage: string) {
    if (!application) return;

    setDetailNotice(null);
    setDetailError(null);

    try {
      const updated = await onPatchApplication(application, payload, successMessage);
      setDetailNotice(successMessage);
      setConfirmAction(null); // close the confirm dialog only on success
      setDraft({
        priority: updated.priority,
        sourceLabel: updated.sourceLabel || "",
        managerNotes: updated.managerNotes || "",
        nextAction: updated.nextAction || "",
        nextActionAt: toDateTimeInputValue(updated.nextActionAt)
      });
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : t.unableQuickAction);
      // Leave the dialog open on error so the confirm button re-enables for retry.
    }
  }

  async function createInvestorAccount() {
    if (!application) return;

    setDetailNotice(null);
    setDetailError(null);

    try {
      const result = await onCreateInvestor(application);
      setAccessCredentials(result.credentials ? { ...result.credentials, applicationId: result.application.id } : null);
      setDetailNotice(t.investorLinkedNotice);
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : t.unableCreateInvestor);
    }
  }

  return (
    <>
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72] xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{application.fullName}</CardTitle>
            <CardDescription>{application.id}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PriorityBadge priority={application.priority} locale={locale} />
            <Badge>{enumLabel("applicationStatus", application.status, locale)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <SlaIndicatorPanel state={slaState} locale={locale} />

        <PriorityReasonsPanel reasons={priorityReasons} locale={locale} />

        <InvestorLinkPanel
          application={application}
          credentials={accessCredentials?.applicationId === application.id ? accessCredentials : null}
          isCreating={isCreatingInvestor}
          onCreate={createInvestorAccount}
          locale={locale}
        />

        <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.quickActions}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.status === "CONTACTED"} onClick={() => runQuickAction({ status: "CONTACTED" }, t.markedContacted)}>{t.markContacted}</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.status === "APPROVED"} onClick={() => setConfirmAction("APPROVED")}>{t.approve}</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.status === "REJECTED"} onClick={() => setConfirmAction("REJECTED")}>{t.reject}</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.priority === "VIP"} onClick={() => runQuickAction({ priority: "VIP" }, t.prioritySetVip)}>{t.setVip}</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || (!application.nextAction && !application.nextActionAt)} onClick={() => runQuickAction({ nextAction: null, nextActionAt: null }, t.nextActionCleared)}>{t.clearNextAction}</Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.priorityLabel}</span>
            <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as ApplicationPriority }))} className="h-12 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45">
              {APPLICATION_PRIORITIES.map((nextPriority) => <option key={nextPriority} value={nextPriority} className="bg-card dark:bg-graphite-900 text-foreground">{enumLabel("applicationPriority", nextPriority, locale)}</option>)}
            </select>
          </label>
          <CrmTextInput label={t.sourceLabelField} value={draft.sourceLabel} onChange={(value) => setDraft((current) => ({ ...current, sourceLabel: value }))} placeholder={t.sourcePlaceholder} />
          <CrmTextInput label={t.nextActionField} value={draft.nextAction} onChange={(value) => setDraft((current) => ({ ...current, nextAction: value }))} placeholder={t.nextActionPlaceholder} />
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.nextActionDateTime}</span>
            <input type="datetime-local" value={draft.nextActionAt} onChange={(event) => setDraft((current) => ({ ...current, nextActionAt: event.target.value }))} className="h-12 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45" />
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.managerNotes}</span>
          <textarea value={draft.managerNotes} onChange={(event) => setDraft((current) => ({ ...current, managerNotes: event.target.value }))} placeholder={t.managerNotesPlaceholder} className="min-h-32 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none focus:border-gold-200/45" />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{isDirty ? t.unsavedChanges : t.fieldsUpToDate}</p>
          <Button type="button" disabled={!isDirty || isSaving} onClick={saveDraft}>
            <Save data-icon="inline-start" />
            {isSaving ? t.saving : t.saveCrmFields}
          </Button>
        </div>
        {detailNotice ? <AdminNotice tone="success" message={detailNotice} /> : null}
        {detailError ? <AdminNotice tone="error" message={detailError} /> : null}

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow label={t.contact} value={`${application.email || t.noEmail} / ${application.telegram || t.noTelegram}`} />
          <DetailRow label={t.country} value={application.country} />
          <DetailRow label={t.plannedAllocation} value={formatMoney(application.plannedAllocationAmount, f)} />
          <DetailRow label={t.depositMethod} value={application.preferredDepositMethod} />
          <DetailRow label={t.investorType} value={application.investorType} />
          <DetailRow label={t.reinvestInterestLabel} value={enumLabel("reinvestInterest", application.reinvestInterest, locale)} />
          <DetailRow label={t.contactedAt} value={formatDateTime(application.contactedAt, f)} />
          <DetailRow label={t.approvedAt} value={formatDateTime(application.approvedAt, f)} />
        </div>
        <NextActionState application={application} locale={locale} />

        <Separator />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.applicationMessage}</p>
          <p className="mt-2 text-sm leading-7 text-foreground">{application.message || t.noNotesProvided}</p>
        </div>

        <Separator />

        <ActivityTimeline items={timeline} locale={locale} />

        <Separator />

        <NotificationEventsPanel events={notificationEvents} locale={locale} />

        <Separator />

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.recentAuditHistory}</p>
          {auditLogs.length === 0 ? (
            <EmptyInlineState title={t.noAuditHistory} description={t.noAuditHistoryDesc} />
          ) : (
            <div className="flex flex-col gap-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt, f)}</p>
                  </div>
                  <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">{log.beforeJson || "{}"}{" -> "}{log.afterJson || "{}"} {t.byWord} {log.actor}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === "REJECTED" ? t.confirmRejectTitle : t.confirmApproveTitle}
        description={confirmAction === "REJECTED" ? t.confirmRejectDesc : t.confirmApproveDesc}
        confirmLabel={confirmAction === "REJECTED" ? t.reject : t.approve}
        cancelLabel={t.dialogBack}
        tone={confirmAction === "REJECTED" ? "destructive" : "positive"}
        loading={isUpdating}
        onConfirm={() =>
          confirmAction === "REJECTED"
            ? runQuickAction({ status: "REJECTED" }, t.applicationRejected)
            : runQuickAction({ status: "APPROVED" }, t.applicationApproved)
        }
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}

function NotificationEventsPanel({ events, locale }: { events: NotificationEvent[]; locale: Locale }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.notificationEvents}</p>
      {events.length === 0 ? (
        <EmptyInlineState title={t.noNotificationEvents} description={t.noNotificationEventsDesc} />
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
                    <BellRing className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.messagePreview?.subject || formatNotificationLabel(event.type)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.createdAt, f)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{enumLabel("notificationChannel", event.channel, locale)}</Badge>
                  <Badge>{enumLabel("notificationStatus", event.status, locale)}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{formatNotificationDetail(event, t)}</p>
              {event.messagePreview?.telegramText ? (
                <div className="mt-3 rounded-xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.035] p-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.telegramPreview}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.messagePreview.telegramText}</p>
                </div>
              ) : null}
              <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">{t.recipient}: {event.recipient}</p>
              {event.error ? <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-gold-100">{event.error}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NextActionState({ application, locale }: { application: AdminApplication; locale: Locale }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);

  if (!application.nextAction && !application.nextActionAt) {
    return <EmptyInlineState title={t.noNextActionShort} description={t.noNextActionDesc} />;
  }

  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.nextActionField}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{application.nextAction || t.noActionTextSet}</p>
      <p className={`mt-2 text-xs ${isOverdue(application.nextActionAt) ? "text-amber-700 dark:text-gold-100" : "text-muted-foreground"}`}>{formatDateTime(application.nextActionAt, f)}</p>
    </div>
  );
}

function ActivityTimeline({ items, locale }: { items: ActivityItem[]; locale: Locale }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);

  if (items.length === 0) {
    return <EmptyInlineState title={t.noActivity} description={t.noActivityDesc} />;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.activityTimeline}</p>
      <div className="relative flex flex-col gap-3 before:absolute before:left-[0.56rem] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-muted/30 dark:bg-white/10">
        {items.map((item) => (
          <div key={item.key} className="relative flex gap-3 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
            <span className="relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
              <Sparkles className="size-3" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
              <span className="mt-2 block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">{formatDateTime(item.at, f)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyInlineState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function CrmTextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold-200/45" />
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
