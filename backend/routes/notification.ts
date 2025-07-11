
import { Router, Request, Response } from 'express';
import { getUserPreferences, setUserPreferences } from '../services/userPreferencesService';

const router = Router();

router.get('/preferences', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId query parameter' });
  }
  const preferences = getUserPreferences(userId);
  res.json(preferences);
});

router.post('/preferences', (req: Request, res: Response) => {
  const userId = req.body.userId as string;
  const preferences = req.body.preferences;
  if (!userId || !preferences) {
    return res.status(400).json({ error: 'Missing userId or preferences in request body' });
  }
  setUserPreferences(userId, preferences);
  res.json({ message: 'Notification preferences updated successfully' });
});

export default router;
