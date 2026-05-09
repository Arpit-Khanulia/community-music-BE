import express from 'express';
import { downloadController } from '../controllers/download.controller.js';

const router = express.Router();

router.post('/download', downloadController.startDownload);
router.get('/download/:id/status', downloadController.getStatus);
router.get('/downloads', downloadController.listDownloads);
router.delete('/downloads/:id', downloadController.deleteDownload);
router.get('/download/:id/file', downloadController.downloadFile);

export default router;