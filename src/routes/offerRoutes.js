import { Router } from "express";
import { acceptOffer, createOffer, getOffer, getOffers } from "../controllers/offerController.js";

const router = Router();

/**
 * @openapi
 * /api/offers:
 *   post:
 *     summary: Place a new single-item NFT offer
 *     description: Atomically locks funds in escrow, records audit ledger debit, and creates offer record in a single transaction.
 *     tags:
 *       - Offers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerId
 *               - nftId
 *               - grossAmountGrams
 *               - expiresAt
 *             properties:
 *               buyerId:
 *                 type: string
 *                 description: Buyer's 24-character ObjectId
 *                 example: "65f1a1a1a1a1a1a1a1a1a101"
 *               nftId:
 *                 type: string
 *                 description: Target NFT 24-character ObjectId
 *                 example: "65f1c3c3c3c3c3c3c3c3c301"
 *               grossAmountGrams:
 *                 type: integer
 *                 description: Offer amount in Grams
 *                 example: 50000
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Future ISO timestamp expiration
 *                 example: "2026-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Offer successfully placed and escrow locked
 *       400:
 *         description: Validation error, insufficient funds, or self-bidding error
 *       404:
 *         description: NFT or Collection not found
 */
router.post("/", createOffer);

/**
 * @openapi
 * /api/offers:
 *   get:
 *     summary: Get all offers
 *     tags:
 *       - Offers
 *     parameters:
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: Filter by Buyer ObjectId
 *       - in: query
 *         name: collectionId
 *         schema:
 *           type: string
 *         description: Filter by Collection ObjectId
 *       - in: query
 *         name: nftId
 *         schema:
 *           type: string
 *         description: Filter by NFT ObjectId
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, cancelled, expired, invalidated]
 *         description: Filter by Offer status
 *     responses:
 *       200:
 *         description: List of offers
 */
router.get("/", getOffers);

/**
 * @openapi
 * /api/offers/{id}:
 *   get:
 *     summary: Get offer by ID
 *     tags:
 *       - Offers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 24-character hex ObjectId
 *     responses:
 *       200:
 *         description: Offer details
 *       400:
 *         description: Invalid offer ID format
 *       404:
 *         description: Offer not found
 */
router.get("/:id", getOffer);

/**
 * @openapi
 * /api/offers/{id}/accept:
 *   post:
 *     summary: Accept and settle a single-item NFT offer
 *     description: Atomically transfers NFT ownership, disburses net payout to seller and royalties to creator, closes escrow/offer, and cascades refunds to all competing bids.
 *     tags:
 *       - Offers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 24-character hex Offer ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *             properties:
 *               sellerId:
 *                 type: string
 *                 description: Authenticated seller's 24-character ObjectId
 *                 example: "65f1a1a1a1a1a1a1a1a1a102"
 *     responses:
 *       200:
 *         description: Offer accepted and settled successfully
 *       400:
 *         description: Invalid state, invalid ID, or seller authorization failure
 *       403:
 *         description: Seller not authorized or NFT locked
 *       404:
 *         description: Offer not found or expired
 */
router.post("/:id/accept", acceptOffer);

export default router;
