import express from 'express';
import { ragApiController } from '../controllers/ragController.js';

const router = express.Router();

router.post('/ask', ragApiController);

export default router;