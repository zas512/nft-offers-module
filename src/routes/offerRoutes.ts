import { Router } from "express";
import {
  acceptOffer,
  createOffer,
  getOffer,
  getOffers,
  getOffersByNftId,
  getOffersByUserId,
  rejectOffer
} from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  createOfferSchema,
  idParamSchema,
  offerActionBodySchema,
  offerFilterQuerySchema
} from "../validations/index.js";

const router = Router();

router
  .get("/", validate({ query: offerFilterQuerySchema }), getOffers)
  .post("/", validate({ body: createOfferSchema }), createOffer);
router.get("/user/:id", validate({ params: idParamSchema }), getOffersByUserId);
router.get("/nft/:id", validate({ params: idParamSchema }), getOffersByNftId);
router.get("/:id", validate({ params: idParamSchema }), getOffer);
router.post(
  "/:id/accept",
  validate({ params: idParamSchema, body: offerActionBodySchema }),
  acceptOffer
);
router.post(
  "/:id/reject",
  validate({ params: idParamSchema, body: offerActionBodySchema }),
  rejectOffer
);

export default router;
