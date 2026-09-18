import { acceptOffer, createOffer, getOffer, getOffers } from "../controllers/index.js";
import { createApiRouter } from "../utils/routeHelper.js";
import {
  acceptOfferBodySchema,
  createSingleItemOfferBodySchema,
  idParamSchema,
  offerFilterQuerySchema
} from "../validations/index.js";

const api = createApiRouter("/api/offers", "Offers");

api.get(
  "/",
  { summary: "Get all offers with optional filters", validate: { query: offerFilterQuerySchema } },
  getOffers
);
api.post(
  "/",
  { summary: "Create single-item NFT offer", validate: { body: createSingleItemOfferBodySchema } },
  createOffer
);
api.get("/:id", { summary: "Get offer by ID", validate: { params: idParamSchema } }, getOffer);
api.post(
  "/:id/accept",
  {
    summary: "Accept and settle single-item offer",
    validate: { params: idParamSchema, body: acceptOfferBodySchema }
  },
  acceptOffer
);

export default api.router;
