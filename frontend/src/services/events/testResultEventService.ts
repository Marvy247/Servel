import type { TestResultEvent } from '../../types/testEvents'
import { EventListenerService } from './eventListenerService'

export class TestResultEventService {
  private eventListener: EventListenerService

  constructor(eventListener: EventListenerService) {
    this.eventListener = eventListener
  }

  async getLatestResults(): Promise<TestResultEvent[]> {
    // Implementation with mock data
    return [{
      type: 'test_result',
      projectId: 'test-project',
      timestamp: Date.now(),
      results: [
        {
          id: '1',
          name: 'Token Contract: Transfer',
          status: 'passed',
          duration: 1200,
          type: 'unit',
          gasUsed: 45000
          },
        {
          id: '2',
          name: 'Token Contract: Approve',
          status: 'passed',
          duration: 800,
          type: 'unit',
          gasUsed: 32000
        },
        {
          id: '3',
          name: 'Vault Contract: Deposit',
          status: 'failed',
          duration: 1500,
          type: 'integration',
          details: 'Expected revert not received',
          gasUsed: 78000
        }
      ],
      stats: {
        total: 42,
        passed: 38,
        coverage: 92,
        avgDuration: 1200,
        avgGasUsed: 52000,
        maxGasUsed: 78000,
        slitherFindings: 2,
        fuzzCoverage: 85,
        invariantViolations: 0,
        history: []
      }
    }]
  }
}

// Explicit default export
export default TestResultEventService
