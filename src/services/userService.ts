import mongoose from "mongoose";
import { User } from "../models/index.js";
import type { IUser } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class UserService {
  public async getAllUsers(): Promise<IUser[]> {
    return User.find().lean<IUser[]>();
  }
  public async getAllUsersWithNfts(): Promise<unknown[]> {
    return User.aggregate([
      {
        $lookup: {
          from: "nfts",
          localField: "_id",
          foreignField: "ownerId",
          as: "nfts"
        }
      }
    ]);
  }
  public async getUserById(id: string): Promise<IUser> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid user ID format");
    }
    const user = await User.findById(id).lean<IUser | null>();
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  }
  public async getUserByIdWithNfts(id: string): Promise<Record<string, unknown>> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid user ID format");
    }
    const results = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: "nfts",
          localField: "_id",
          foreignField: "ownerId",
          as: "nfts"
        }
      }
    ]);
    if (!results.length) {
      throw AppError.notFound("User not found");
    }
    return results[0] as Record<string, unknown>;
  }
}

export const userService = new UserService();
