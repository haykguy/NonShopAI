import { Router } from 'express';
import healthRouter from './health';
import projectsRouter from './projects';
import generationRouter from './generation';
import compileRouter from './compile';
import chatRouter from './chat';
import productsRouter from './products';
import videoStylesRouter from './videoStyles';
import avatarsRouter from './avatars';
import accountsRouter from './accounts';
import videoMetadataRouter from './videoMetadata';
import savedScriptsRouter from './savedScripts';
import captchaRouter from './captcha';
import imagesRouter from './images';

const router = Router();

router.use('/health', healthRouter);
router.use('/projects', projectsRouter);
router.use('/projects', generationRouter);
router.use('/projects', compileRouter);
router.use('/projects', chatRouter);
router.use('/products', productsRouter);
router.use('/video-styles', videoStylesRouter);
router.use('/avatars', avatarsRouter);
router.use('/accounts', accountsRouter);
router.use('/video-metadata', videoMetadataRouter);
router.use('/scripts', savedScriptsRouter);
router.use('/captcha', captchaRouter);
router.use('/images', imagesRouter);

export default router;
