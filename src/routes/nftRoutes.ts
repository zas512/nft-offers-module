import { getNftByIdHandler, getNfts } from "../controllers/index.js";
import { createApiRouter } from "../utils/routeHelper.js";
import { nftFilterQuerySchema, nftParamSchema } from "../validations/index.js";

const api = createApiRouter("/api/nfts", "NFTs");

api.get(
  "/",
  { summary: "Get all NFTs with optional filters", validate: { query: nftFilterQuerySchema } },
  getNfts
);
api.get(
  "/:id",
  { summary: "Get NFT by ID", validate: { params: nftParamSchema } },
  getNftByIdHandler
);

export default api.router;
