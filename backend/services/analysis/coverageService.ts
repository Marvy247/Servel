import type { TestResultEvent } from '../../types/testEvents';
import logger from '../../utils/logger';

type TestCoverage = {
  projectId: string;
  timestamp: number;
  overallPercentage: number;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  files: {
    path: string;
    lineCoverage: number;
    branchCoverage: number;
    functionCoverage: number;
  }[];
};

export class CoverageService {
  private static coverageData: TestCoverage | null = null;
  private static lastUpdated: number = 0;

  static async getCurrentCoverage(projectId: string): Promise<TestCoverage> {
    if (!this.coverageData || Date.now() - this.lastUpdated > 300000) { // 5 minute cache
      throw new Error('No current coverage data available');
    }
    if (this.coverageData.projectId !== projectId) {
      throw new Error('Coverage data does not match requested project');
    }
    return this.coverageData;
  }

  static async processCoverageReport(event: TestResultEvent): Promise<void> {
    if (!event.stats?.coverage || !event.results) {
      throw new Error('Invalid test result event - missing coverage data');
    }

    const coverageData: TestCoverage = {
      projectId: event.projectId,
      timestamp: event.timestamp,
      overallPercentage: event.stats.coverage,
      lineCoverage: event.stats.coverage,
      branchCoverage: event.stats.coverage,
      functionCoverage: event.stats.coverage,
      files: []
    };

    this.coverageData = coverageData;
    this.lastUpdated = Date.now();
    logger.info(`Updated coverage data for project ${event.projectId}: ${event.stats.coverage}%`);
  }

  static async resetCoverage(): Promise<void> {
    this.coverageData = null;
  }
}
