import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { HistoryController } from "./history.controller";

const router = Router();

router.get("/recent-media", HistoryController.getRecentMedia);
router.get("/", checkAuth(), HistoryController.getMyHistory);
router.delete("/:id", checkAuth(), HistoryController.deleteHistoryItem);

export const HistoryRoutes = router;
