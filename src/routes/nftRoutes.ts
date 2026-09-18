import { Router } from "express";
import { getNftByIdHandler, getNfts } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { nftFilterQuerySchema, nftParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", validate({ query: nftFilterQuerySchema }), getNfts);
router.get("/:id", validate({ params: nftParamSchema }), getNftByIdHandler);

export default router;
