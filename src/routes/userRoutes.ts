import { Router } from "express";
import { getUser, getUsers, getUsersWithNfts } from "../controllers/userController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { userParamSchema } from "../validations/userValidation.js";

const router = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get("/", getUsers);

/**
 * @openapi
 * /api/users/with-nfts:
 *   get:
 *     summary: Get all users with their owned NFTs
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users with nested NFTs array
 */
router.get("/with-nfts", getUsersWithNfts);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 24-character hex ObjectId
 *     responses:
 *       200:
 *         description: User details
 *       400:
 *         description: Invalid user ID format
 *       404:
 *         description: User not found
 */
router.get("/:id", validate({ params: userParamSchema }), getUser);

export default router;
