import "dotenv/config";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { closeDb, connectDb } from "../config/db.js";
import { Collection, EscrowAccount, LedgerEntry, Nft, Offer, User } from "../models/index.js";
import type { ICollection, INft, IUser, NftStatus } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawUserData {
  _id: string;
  name: string;
  walletAddress?: string | null;
  telegramId?: string | number | null;
  availableBalance: number;
  createdAt: string;
  updatedAt: string;
}

interface RawCollectionData {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface RawNftData {
  _id: string;
  collectionId: string;
  ownerId: string;
  tokenId: number;
  name: string;
  status: NftStatus;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RawSeedData {
  users: RawUserData[];
  collections: RawCollectionData[];
  nfts: RawNftData[];
}

export async function seedDatabase(): Promise<void> {
  await connectDb();
  const seedDataPath = path.resolve(__dirname, "../data/seedData.json");
  const rawData: RawSeedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));
  const users: Partial<IUser>[] = rawData.users.map((user) => ({
    _id: new mongoose.Types.ObjectId(user._id),
    name: user.name,
    walletAddress: user.walletAddress ? user.walletAddress.toLowerCase().trim() : null,
    telegramId: user.telegramId ? String(user.telegramId).trim() : null,
    availableBalance: user.availableBalance,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt)
  }));
  const collections: Partial<ICollection>[] = rawData.collections.map((col) => ({
    _id: new mongoose.Types.ObjectId(col._id),
    name: col.name.trim(),
    createdAt: new Date(col.createdAt),
    updatedAt: new Date(col.updatedAt)
  }));
  const nfts: Partial<INft>[] = rawData.nfts.map((nft) => ({
    _id: new mongoose.Types.ObjectId(nft._id),
    collectionId: new mongoose.Types.ObjectId(nft.collectionId),
    ownerId: new mongoose.Types.ObjectId(nft.ownerId),
    tokenId: nft.tokenId,
    name: nft.name.trim(),
    status: nft.status,
    isLocked: Boolean(nft.isLocked),
    createdAt: new Date(nft.createdAt),
    updatedAt: new Date(nft.updatedAt)
  }));
  console.log("\nClearing existing collections...");
  await User.deleteMany({});
  await Collection.deleteMany({});
  await Nft.deleteMany({});
  await Offer.deleteMany({});
  await EscrowAccount.deleteMany({});
  await LedgerEntry.deleteMany({});
  console.log("\nSeeding data...");
  const userResult = await User.insertMany(users);
  console.log(`Inserted ${userResult.length} users`);
  const collectionResult = await Collection.insertMany(collections);
  console.log(`Inserted ${collectionResult.length} collections`);
  const nftResult = await Nft.insertMany(nfts);
  console.log(`Inserted ${nftResult.length} NFTs`);
  console.log("\nDatabase seeded successfully!");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
