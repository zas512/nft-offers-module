import { Router } from "express";
import {
  getCollectionById,
  getCollections,
  getCollectionsWithNfts
} from "../controllers/collectionController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { collectionParamSchema } from "../validations/collectionValidation.js";

const router = Router();

router.get("/", getCollections);
router.get("/with-nfts", getCollectionsWithNfts);
router.get("/:id", validate({ params: collectionParamSchema }), getCollectionById);

export default router;
