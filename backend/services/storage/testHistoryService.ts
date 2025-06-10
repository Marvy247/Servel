import type { TestResultEvent } from '../../types/testEvents';
import logger from '../../utils/logger';
import { Database } from '../database';

type TestHistoryEntry = {
  id: string;
  projectId: string;
  timestamp: number;
  status: 'passed' | 'failed' | 'partial';
  coverage: number;
  duration: number;
  testCount: number;
  passedCount: number;
  details?: string;
  createdAt: Date;
};

export class TestHistoryService {
  private static readonly HISTORY_LIMIT = 100;

  static async storeTestResults(event: TestResultEvent): Promise<void> {
    if (!event.stats) {
      throw new Error('Invalid test result event - missing stats');
    }

    const entry: TestHistoryEntry = {
      id: `${event.projectId}-${event.timestamp}`,
      projectId: event.projectId,
      timestamp: event.timestamp,
      status: event.stats.passed === event.stats.total ? 'passed' : 
             event.stats.passed === 0 ? 'failed' : 'partial',
      coverage: event.stats.coverage || 0,
      duration: event.stats.avgDuration || 0,
      testCount: event.stats.total,
      passedCount: event.stats.passed,
      details: event.results?.map(r => `${r.name}:${r.status}`).join(','),
      createdAt: new Date()
    };

    try {
      await Database.insert('test_history', entry);
      await Database.trimCollection('test_history', this.HISTORY_LIMIT);
      logger.info(`Stored test history for ${event.projectId}`);
    } catch (error) {
      logger.error(`Failed to store test history: ${error}`);
      throw error;
    }
  }

  static async getTestHistory(projectId: string, limit = 20): Promise<TestHistoryEntry[]> {
    try {
      return await Database.find('test_history', 
        { projectId }, 
        { sort: { timestamp: -1 }, limit });
    } catch (error) {
      logger.error(`Failed to get test history: ${error}`);
      throw error;
    }
  }

  static async getLatestResults(limit = 10): Promise<TestResultEvent[]> {
    try {
      const historyEntries = await Database.find('test_history', 
        {}, 
        { sort: { timestamp: -1 }, limit });
      
      return historyEntries.map(entry => ({
        type: 'test_result',
        projectId: entry.projectId,
        timestamp: entry.timestamp,
        status: entry.status,
        stats: {
          total: entry.testCount,
          passed: entry.passedCount,
          coverage: entry.coverage,
          avgDuration: entry.duration
        },
        results: entry.details?.split(',').map((detail: string) => {
          const [name, status] = detail.split(':');
          return { 
            name, 
            status: status as 'passed' | 'failed' | 'skipped' 
          };
        }) || []
      }));
    } catch (error) {
      logger.error(`Failed to get latest test results: ${error}`);
      throw error;
    }
  }
}
