import { TestHistoryService } from '../storage/testHistoryService';
import type { TestResultEvent } from '../../types/testEvents';
import logger from '../../utils/logger';
import { EventListenerService } from './eventListenerService';

export class TestResultEventService {
  private subscriptions = new Map<string, (event: TestResultEvent) => void>();
  private eventListenerService: EventListenerService;

  constructor(eventListenerService: EventListenerService) {
    this.eventListenerService = eventListenerService;
  }

  async handleTestResultEvent(event: TestResultEvent): Promise<void> {
    try {
      // Validate event structure
      if (!event.projectId || !event.timestamp) {
        throw new Error('Invalid test result event - missing required fields');
      }

      // Store test results in history
      await TestHistoryService.storeTestResults(event);

      // Broadcast to WebSocket clients
      this.eventListenerService.broadcastToClients({
        type: 'test_result',
        data: event
      });

      // Notify all subscribers
      for (const callback of this.subscriptions.values()) {
        try {
          callback(event);
        } catch (error) {
          logger.error(`Error in test result event callback: ${error}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to process test result event: ${error}`);
      throw error;
    }
  }

  subscribe(callback: (event: TestResultEvent) => void): string {
    const id = Math.random().toString(36).substring(2, 10);
    this.subscriptions.set(id, callback);
    logger.info(`New test result subscriber: ${id}`);
    return id;
  }

  unsubscribe(id: string): boolean {
    const result = this.subscriptions.delete(id);
    if (result) {
      logger.info(`Unsubscribed test result listener: ${id}`);
    }
    return result;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
    logger.info('Cleared all test result subscriptions');
  }

  async getLatestResults(): Promise<TestResultEvent[]> {
    try {
      return await TestHistoryService.getLatestResults();
    } catch (error) {
      logger.error(`Failed to get latest test results: ${error}`);
      throw error;
    }
  }
}
