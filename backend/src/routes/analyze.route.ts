import { Router } from 'express';
import { analyzeRepository } from '../controllers/analyze.controller';

const router = Router();

// POST /api/analyze
router.post('/', analyzeRepository);

export default router;
