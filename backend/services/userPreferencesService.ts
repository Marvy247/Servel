interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  webhook: boolean;
  webhookUrl?: string;
  emailAddress?: string;
}

// In-memory store for user preferences as placeholder
const userPreferences: Record<string, NotificationPreferences> = {};

export function getUserPreferences(userId: string): NotificationPreferences {
  return userPreferences[userId] || {
    email: true,
    inApp: true,
    webhook: false,
    emailAddress: '',
    webhookUrl: ''
  };
}

export function setUserPreferences(userId: string, preferences: NotificationPreferences): void {
  userPreferences[userId] = preferences;
}
