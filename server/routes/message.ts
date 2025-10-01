import { Router } from "express";
import { getConversationMessages } from "../controllers/message";

const router = Router();

router.get("/all/:conversationId", getConversationMessages as any);

export default router;
