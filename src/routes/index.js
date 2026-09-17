import { Router } from "express";
import collectionRoutes from "./collectionRoutes.js";
import nftRoutes from "./nftRoutes.js";
import offerRoutes from "./offerRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/collections", collectionRoutes);
router.use("/nfts", nftRoutes);
router.use("/offers", offerRoutes);

export default router;
