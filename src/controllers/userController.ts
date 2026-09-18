import type { Request, Response } from "express";
import { userService } from "../services/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export class UserController {
  public getUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    logger.flow("FETCH_USERS", "Retrieving all registered users");
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
  });
  public getUsersWithNfts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    logger.flow("FETCH_USERS_WITH_NFTS", "Retrieving all users with their owned NFTs");
    const users = await userService.getAllUsersWithNfts();
    res.status(200).json({ success: true, count: users.length, data: users });
  });
  public getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    logger.flow("FETCH_USER", `Retrieving user by ID: ${id}`);
    const user = await userService.getUserById(id);
    res.status(200).json({ success: true, data: user });
  });
  public getUserWithNfts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    logger.flow("FETCH_USER_WITH_NFTS", `Retrieving user with NFTs for ID: ${id}`);
    const user = await userService.getUserByIdWithNfts(id);
    res.status(200).json({ success: true, data: user });
  });
}

export const userController = new UserController();
export const getUsers = userController.getUsers;
export const getUsersWithNfts = userController.getUsersWithNfts;
export const getUser = userController.getUser;
export const getUserWithNfts = userController.getUserWithNfts;
