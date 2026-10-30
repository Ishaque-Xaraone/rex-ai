import { Router } from 'express';
import healthRoutes from './health.routes.js';
import projectRoutes from './project.routes.js';
import analysisRoutes from './analysis.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/analysis', analysisRoutes);

export default apiRouter;
