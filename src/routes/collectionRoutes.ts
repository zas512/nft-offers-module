import { getCollectionById, getCollections, getCollectionsWithNfts } from "../controllers/index.js";
import { createApiRouter } from "../utils/routeHelper.js";
import { collectionParamSchema } from "../validations/index.js";

const api = createApiRouter("/api/collections", "Collections");

api.get("/", { summary: "Get all collections" }, getCollections);
api.get("/with-nfts", { summary: "Get all collections with nested NFTs" }, getCollectionsWithNfts);
api.get(
  "/:id",
  { summary: "Get collection by ID with NFTs", validate: { params: collectionParamSchema } },
  getCollectionById
);

export default api.router;
