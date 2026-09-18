import { Router } from "express";
import { getUser, getUsers, getUsersWithNfts, getUserWithNfts } from "../controllers/index.js";
const router = Router();

router.get("/", getUsers);
router.get("/with-nfts", getUsersWithNfts);
router.get("/:id", getUser);
router.get("/:id/with-nfts", getUserWithNfts);

export default router;
