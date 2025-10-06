import { Router } from "express";
import {
  sendRequestToFriend,
  getFrendList,
  respondToFriendRequest,
  getFriendRequestList,
  removeSentFriendRequest,
  getSentFriendRequestList,
} from "../controllers/friends";

const router = Router();

router.post("/send-request", sendRequestToFriend as any);
router.delete("/remove-request", removeSentFriendRequest as any);
router.post("/response-request", respondToFriendRequest as any);
router.get("/all/:userId", getFrendList as any);
router.get("/all/requests/:userId", getFriendRequestList as any);
router.get("/all/sent-requests/:userId", getSentFriendRequestList as any);

export default router;
