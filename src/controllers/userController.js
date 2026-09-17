import { getAllUsers, getAllUsersWithNfts, getUserById } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getUsers = asyncHandler(async (_req, res) => {
  logger.flow("FETCH_USERS", "Retrieving all registered users");
  const users = await getAllUsers();
  res.status(200).json({ success: true, count: users.length, data: users });
});

export const getUsersWithNfts = asyncHandler(async (_req, res) => {
  logger.flow("FETCH_USERS_WITH_NFTS", "Retrieving all users with their owned NFTs");
  const users = await getAllUsersWithNfts();
  res.status(200).json({ success: true, count: users.length, data: users });
});

export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.flow("FETCH_USER", `Retrieving user by ID: ${id}`);
  const user = await getUserById(id);
  res.status(200).json({ success: true, data: user });
});
