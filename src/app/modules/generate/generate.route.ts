import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post('/text-to-image', checkAuth())

export const generateRoutes = router;
