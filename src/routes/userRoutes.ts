import { Router } from "express";
import { getUser, getUsers, getUsersWithNfts, getUserWithNfts, getOffersByUserId } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { idParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", getUsers);
router.get("/with-nfts", getUsersWithNfts);
router.get("/:id", validate({ params: idParamSchema }), getUser);
router.get("/:id/with-nfts", validate({ params: idParamSchema }), getUserWithNfts);
router.get("/:id/offers", validate({ params: idParamSchema }), getOffersByUserId);

export default router;
