import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/:loadId', chatController.getMessages);
router.post('/:loadId', chatController.sendMessage);

export default router;
