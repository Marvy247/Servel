import express from 'express';
import { SlitherService } from '../services/analysis/slitherService';
import { TestResultEventService } from '../services/events/testResultEventService';
import { CoverageService } from '../services/analysis/coverageService';
import { TestHistoryService } from '../services/storage/testHistoryService';
import { EventListenerService } from '../services/events/eventListenerService';

const router = express.Router();

// Initialize services
const providerUrl = process.env.PROVIDER_URL || 'http://localhost:8545';
const wssPort = parseInt(process.env.WSS_PORT || '8080', 10);
const eventListenerService = new EventListenerService(providerUrl, wssPort);
const testResultEventService = new TestResultEventService(eventListenerService);

// Get latest test results
router.get('/test-results', async (req, res) => {
  try {
    const testResults = await testResultEventService.getLatestResults();
    res.json(testResults);
  } catch (error) {
    console.error('Failed to get test results:', error);
    res.status(500).json({ error: 'Failed to retrieve test results' });
  }
});

// Get test coverage metrics
router.get('/test-coverage', async (req, res) => {
  try {
    const coverage = await CoverageService.getCurrentCoverage();
    res.json(coverage);
  } catch (error) {
    console.error('Failed to get test coverage:', error);
    res.status(500).json({ error: 'Failed to retrieve coverage data' });
  }
});

// Get Slither analysis results
router.get('/slither/results', async (req, res) => {
  try {
    const results = await SlitherService.getLatestResults();
    res.json(results);
  } catch (error) {
    console.error('Failed to get Slither results:', error);
    res.status(500).json({ error: 'Failed to retrieve security analysis' });
  }
});

// Get historical test data
router.get('/test-history', async (req, res) => {
  try {
    const history = await TestHistoryService.getTestHistory();
    res.json(history);
  } catch (error) {
    console.error('Failed to get test history:', error);
    res.status(500).json({ error: 'Failed to retrieve test history' });
  }
});

export default router;
