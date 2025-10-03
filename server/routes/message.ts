import { Router } from "express";
import {
  getConversationMessages,
  getPublicMessages,
} from "../controllers/message";

const router = Router();

router.get("/all/:conversationId", getConversationMessages as any);
router.get("/all/msg/public", getPublicMessages as any);

export default router;
