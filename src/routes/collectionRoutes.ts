import { Router } from "express";
import { getCollectionById, getCollections, getCollectionsWithNfts } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { idParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", getCollections);
router.get("/with-nfts", getCollectionsWithNfts);
router.get("/:id", validate({ params: idParamSchema }), getCollectionById);

export default router;
