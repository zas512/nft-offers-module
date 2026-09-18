import { getUser, getUsers, getUsersWithNfts } from "../controllers/index.js";
import { createApiRouter } from "../utils/routeHelper.js";
import { userParamSchema } from "../validations/index.js";

const api = createApiRouter("/api/users", "Users");

api.get("/", { summary: "Get all registered users" }, getUsers);
api.get("/with-nfts", { summary: "Get all users with their owned NFTs" }, getUsersWithNfts);
api.get("/:id", { summary: "Get user by ID", validate: { params: userParamSchema } }, getUser);

export default api.router;
