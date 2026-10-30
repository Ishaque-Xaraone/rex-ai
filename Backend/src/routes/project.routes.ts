import { Router } from 'express';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import { ProjectController } from '../controllers/project.controller.js';
import { config } from '../config/index.js';

const router = Router();

// Configure safe multer storage
const upload = multer({
  dest: path.join(os.tmpdir(), 'rex-uploads'),
  limits: {
    fileSize: config.security.maxUploadSizeBytes,
    files: 1,
  },
});

router.post('/import', upload.single('archive'), ProjectController.importProject);
router.get('/', ProjectController.listProjects);
router.get('/:projectId', ProjectController.getProjectById);
router.get('/:projectId/files', ProjectController.getProjectFiles);
router.post('/:projectId/analyze', ProjectController.triggerAnalysis);

export default router;
