export function isNotificationDeliveryEnabled() {
  return process.env.NOTIFICATIONS_DELIVERY_ENABLED === "true";
}

export function getEmailProviderName() {
  return process.env.EMAIL_PROVIDER || "disabled";
}

export function getTelegramProviderName() {
  return process.env.TELEGRAM_PROVIDER || "disabled";
}
