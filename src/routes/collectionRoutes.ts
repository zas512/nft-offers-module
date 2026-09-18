import { Router } from "express";
import {
  getCollectionById,
  getCollections,
  getCollectionsWithNfts
} from "../controllers/collectionController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { collectionParamSchema } from "../validations/collectionValidation.js";

const router = Router();

/**
 * @openapi
 * /api/collections:
 *   get:
 *     summary: Get all collections
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: List of all collections
 */
router.get("/", getCollections);

/**
 * @openapi
 * /api/collections/with-nfts:
 *   get:
 *     summary: Get all collections including their nested NFTs
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: List of collections with associated NFTs
 */
router.get("/with-nfts", getCollectionsWithNfts);

/**
 * @openapi
 * /api/collections/{id}:
 *   get:
 *     summary: Get single collection with its NFTs by ID
 *     tags:
 *       - Collections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 24-character hex ObjectId
 *     responses:
 *       200:
 *         description: Collection details with nested NFTs
 *       400:
 *         description: Invalid collection ID format
 *       404:
 *         description: Collection not found
 */
router.get("/:id", validate({ params: collectionParamSchema }), getCollectionById);

export default router;
