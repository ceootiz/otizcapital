import type { NotificationEvent } from "@prisma/client";
import type { NotificationProvider, NotificationProviderResult } from "./providers";
import { DisabledEmailProvider, DisabledTelegramProvider, InternalNotificationProvider } from "./providers";

export class NotificationProviderRegistry {
  constructor(private readonly providers: NotificationProvider[]) {}

  getProvider(event: NotificationEvent) {
    return this.providers.find((provider) => provider.canHandle(event)) ?? null;
  }

  async process(event: NotificationEvent): Promise<NotificationProviderResult> {
    const provider = this.getProvider(event);

    if (!provider) {
      return {
        status: "FAILED",
        reason: `No notification provider registered for channel ${event.channel}`,
        message: {
          channel: event.channel,
          recipient: event.recipient,
          subject: event.type,
          text: `No provider registered for ${event.channel}`,
          payload: {}
        }
      };
    }

    provider.buildMessage(event);
    return provider.send(event);
  }
}

export function createDefaultNotificationProviderRegistry() {
  return new NotificationProviderRegistry([
    new InternalNotificationProvider(),
    new DisabledEmailProvider(),
    new DisabledTelegramProvider()
  ]);
}
