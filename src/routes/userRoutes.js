import { Router } from "express";
import { getUser, getUsers } from "../controllers/userController.js";

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
router.get("/:id", getUser);

export default router;
