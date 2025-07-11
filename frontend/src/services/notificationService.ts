import axios from 'axios';

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  webhook: boolean;
  webhookUrl?: string;
  emailAddress?: string;
}

const API_BASE = '/api/notification';

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const response = await axios.get(`${API_BASE}/preferences`, { params: { userId } });
  return response.data;
}

export async function updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
  await axios.post(`${API_BASE}/preferences`, { userId, preferences });
}
