import { Router } from "express";
import { getUser, getUsers, getUsersWithNfts } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { userParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", getUsers);
router.get("/with-nfts", getUsersWithNfts);
router.get("/:id", validate({ params: userParamSchema }), getUser);

export default router;
