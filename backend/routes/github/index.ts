import express from 'express';
import authRouter from './auth';
import repositoryRouter from './repository';

const router = express.Router();

// Mount sub-routers
router.use('/auth', authRouter);
router.use('/repos', repositoryRouter);

export default router;
