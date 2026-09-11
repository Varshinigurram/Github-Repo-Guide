import { Router } from 'express';
import { askRepository } from '../controllers/ask.controller.js';

const router = Router();

/**
 * POST /api/ask
 * Grounded Q&A endpoint for answering user questions about public GitHub repositories.
 */
router.post('/', askRepository);

export default router;
