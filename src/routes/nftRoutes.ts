import { Router } from "express";
import { getNftByIdHandler, getNfts } from "../controllers/index.js";
const router = Router();

router.get("/", getNfts);
router.get("/:id", getNftByIdHandler);

export default router;
