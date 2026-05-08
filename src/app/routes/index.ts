import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { generateRoutes } from "../modules/generate/generate.route";

const router = Router()

router.use('/auth', AuthRoutes)
router.use('/generate', generateRoutes)

export const indexRoute = router;
