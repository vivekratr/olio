import { Router } from "express";

const router: Router = Router();

router.get("/health", (_, res) => {
    res.json({
        success: true,
        message: "API is Healthy"
    })
})

export default router;