import { Router } from "express";
import { acceptOffer, createOffer, getOffer, getOffers } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { createOfferSchema, idParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", getOffers).post("/", validate({ body: createOfferSchema }), createOffer);
router.get("/:id", validate({ params: idParamSchema }), getOffer);
router.post("/:id/accept", validate({ params: idParamSchema }), acceptOffer);

export default router;
