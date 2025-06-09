import express from 'express';

const router = express.Router();

// Basic health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
