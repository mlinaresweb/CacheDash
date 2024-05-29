// src/api/routes/riotRoutes.ts
import { Router } from 'express';
import { addKey, getKey } from '../controllers/cacheController';

const router = Router();

router.post('/add-key', addKey);
router.get('/get-key', getKey);


export default router;