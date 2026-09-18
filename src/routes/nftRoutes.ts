import { Router } from "express";
import { getNftByIdHandler, getNfts, getOffersByNftId } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { idParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", getNfts);
router.get("/:id", validate({ params: idParamSchema }), getNftByIdHandler);
router.get("/:id/offers", validate({ params: idParamSchema }), getOffersByNftId);

export default router;
