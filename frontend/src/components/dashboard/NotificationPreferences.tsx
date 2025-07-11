import React, { useEffect, useState } from 'react';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

const userId = 'defaultUser'; // Replace with actual user id from auth context

const NotificationPreferencesComponent: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    inApp: true,
    webhook: false,
    emailAddress: '',
    webhookUrl: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPreferences() {
      try {
        setIsLoading(true);
        const prefs = await getNotificationPreferences(userId);
        setPreferences(prefs);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load notification preferences.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPreferences();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggle = (name: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateNotificationPreferences(userId, preferences);
      toast({
        title: 'Success',
        description: 'Notification preferences updated successfully.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '32rem', width: '100%', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Notification Preferences</h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
        Manage how you receive notifications from our service
      </p>
      <form onSubmit={handleSubmit}>
        {/* Email Notifications */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Email Notifications</span>
            <input
              type="checkbox"
              name="email"
              checked={preferences.email}
              onChange={() => handleToggle('email')}
            />
          </label>
          {preferences.email && (
            <div style={{ marginLeft: '0.25rem' }}>
              <label htmlFor="emailAddress" style={{ display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
              <input
                id="emailAddress"
                type="email"
                name="emailAddress"
                value={preferences.emailAddress}
                onChange={handleChange}
                placeholder="your@email.com"
                required={preferences.email}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                We'll send notifications to this address
              </p>
            </div>
          )}
        </div>

        {/* In-App Notifications */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <label htmlFor="inApp" style={{ fontWeight: '500' }}>In-App Notifications</label>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Show notifications within the application
            </p>
          </div>
          <input
            id="inApp"
            type="checkbox"
            name="inApp"
            checked={preferences.inApp}
            onChange={() => handleToggle('inApp')}
          />
        </div>

        {/* Webhook Notifications */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Webhook Notifications</span>
            <input
              type="checkbox"
              name="webhook"
              checked={preferences.webhook}
              onChange={() => handleToggle('webhook')}
            />
          </label>
          {preferences.webhook && (
            <div style={{ marginLeft: '0.25rem' }}>
              <label htmlFor="webhookUrl" style={{ display: 'block', marginBottom: '0.25rem' }}>Webhook URL</label>
              <input
                id="webhookUrl"
                type="url"
                name="webhookUrl"
                value={preferences.webhookUrl}
                onChange={handleChange}
                placeholder="https://your-webhook-endpoint.com"
                required={preferences.webhook}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                We'll POST notifications to this URL
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '0.375rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export default NotificationPreferencesComponent;
