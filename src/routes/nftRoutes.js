import { Router } from "express";
import { getNftByIdHandler, getNfts } from "../controllers/nftController.js";

const router = Router();

/**
 * @openapi
 * /api/nfts:
 *   get:
 *     summary: Get all NFTs
 *     tags:
 *       - NFTs
 *     parameters:
 *       - in: query
 *         name: collectionId
 *         schema:
 *           type: string
 *         description: Filter by Collection ObjectId
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *         description: Filter by Owner ObjectId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, listed, burned, transferred]
 *         description: Filter by NFT status
 *     responses:
 *       200:
 *         description: List of all NFTs matching filter
 */
router.get("/", getNfts);

/**
 * @openapi
 * /api/nfts/{id}:
 *   get:
 *     summary: Get NFT by ID
 *     tags:
 *       - NFTs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 24-character hex ObjectId
 *     responses:
 *       200:
 *         description: NFT details
 *       400:
 *         description: Invalid NFT ID format
 *       404:
 *         description: NFT not found
 */
router.get("/:id", getNftByIdHandler);

export default router;
