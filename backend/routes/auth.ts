import { Router } from 'express';
import passport from 'passport';
import { login, callback, logout } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email', 'repo'] 
}));

router.get('/github/callback', 
  passport.authenticate('github', { 
    failureRedirect: '/login',
    session: true 
  }),
  callback
);

// Session-based routes
router.get('/login', login);
router.get('/logout', authenticate(), logout);
router.get('/status', authenticate(), (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

export default router;
