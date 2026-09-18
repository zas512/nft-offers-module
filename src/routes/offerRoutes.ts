import { Router } from "express";
import { acceptOffer, createOffer, getOffer, getOffers } from "../controllers/index.js";
const router = Router();

router.get("/", getOffers).post("/", createOffer);
router.get("/:id", getOffer);
router.post("/:id/accept", acceptOffer);

export default router;
