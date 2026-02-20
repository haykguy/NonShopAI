import { Router } from 'express';
import healthRouter from './health';
import projectsRouter from './projects';
import generationRouter from './generation';
import compileRouter from './compile';
import chatRouter from './chat';

const router = Router();

router.use('/health', healthRouter);
router.use('/projects', projectsRouter);
router.use('/projects', generationRouter);
router.use('/projects', compileRouter);
router.use('/projects', chatRouter);

export default router;
