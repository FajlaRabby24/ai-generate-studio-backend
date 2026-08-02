import { Router } from "express";
import { HistoryController } from "./history.controller";

const router = Router();

router.get("/", HistoryController.getMyHistory);
router.delete("/:id", HistoryController.deleteHistoryItem);

export const HistoryRoutes = router;
