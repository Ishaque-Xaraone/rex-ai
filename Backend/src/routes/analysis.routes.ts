import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller.js';

const router = Router();

router.get('/:analysisId', AnalysisController.getAnalysisJob);
router.get('/:analysisId/graph', AnalysisController.getAnalysisGraph);
router.get('/:analysisId/findings', AnalysisController.getAnalysisFindings);
router.get('/:analysisId/report', AnalysisController.getAnalysisReport);

export default router;
