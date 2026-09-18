import { Router } from "express";
import { acceptOffer, createOffer, getOffer, getOffers } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { idParamSchema } from "../validations/index.js";
import {
  acceptOfferBodySchema,
  createSingleItemOfferBodySchema,
  offerFilterQuerySchema
} from "../validations/index.js";

const router = Router();

router
  .route("/")
  .get(validate({ query: offerFilterQuerySchema }), getOffers)
  .post(validate({ body: createSingleItemOfferBodySchema }), createOffer);
router.get("/:id", validate({ params: idParamSchema }), getOffer);
router.post(
  "/:id/accept",
  validate({ params: idParamSchema, body: acceptOfferBodySchema }),
  acceptOffer
);

export default router;
