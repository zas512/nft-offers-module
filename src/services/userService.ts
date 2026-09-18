import { type Document, ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import type { IUser } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class UserService {
  public async getAllUsers(): Promise<IUser[]> {
    const db = getDb();
    return db.collection<IUser>(COLLECTIONS.USERS).find({}).toArray();
  }

  public async getAllUsersWithNfts(): Promise<Document[]> {
    const db = getDb();
    return db
      .collection(COLLECTIONS.USERS)
      .aggregate([
        {
          $lookup: {
            from: COLLECTIONS.NFTS,
            localField: "_id",
            foreignField: "ownerId",
            as: "nfts"
          }
        }
      ])
      .toArray();
  }

  public async getUserById(id: string): Promise<IUser> {
    if (!id || !ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid user ID format");
    }
    const db = getDb();
    const user = await db.collection<IUser>(COLLECTIONS.USERS).findOne({ _id: new ObjectId(id) });
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  }
}

export const userService = new UserService();

export const getAllUsers = () => userService.getAllUsers();
export const getAllUsersWithNfts = () => userService.getAllUsersWithNfts();
export const getUserById = (id: string) => userService.getUserById(id);
