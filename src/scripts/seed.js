import "dotenv/config";
import { Int32, Long, ObjectId } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb, connectDb } from "../config/db.js";
import {
  COLLECTIONS,
  collectionSchemaValidator,
  escrowSchemaValidator,
  ledgerSchemaValidator,
  nftSchemaValidator,
  offerSchemaValidator,
  userSchemaValidator
} from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validators = {
  [COLLECTIONS.USERS]: userSchemaValidator,
  [COLLECTIONS.COLLECTIONS]: collectionSchemaValidator,
  [COLLECTIONS.NFTS]: nftSchemaValidator,
  [COLLECTIONS.OFFERS]: offerSchemaValidator,
  [COLLECTIONS.ESCROW_ACCOUNTS]: escrowSchemaValidator,
  [COLLECTIONS.LEDGER_ENTRIES]: ledgerSchemaValidator
};

async function ensureCollectionsWithValidators(db) {
  const existingCollections = new Set((await db.listCollections().toArray()).map((c) => c.name));
  for (const [colName, validator] of Object.entries(validators)) {
    if (!existingCollections.has(colName)) {
      await db.createCollection(colName, { validator });
      console.log(`Created collection '${colName}' with schema validator`);
    } else {
      await db.command({
        collMod: colName,
        validator,
        validationLevel: "strict"
      });
      console.log(`Updated schema validator on '${colName}'`);
    }
  }
}

export async function seedDatabase() {
  const db = await connectDb();
  console.log("\nSetting up collections and schema validation...");
  await ensureCollectionsWithValidators(db);
  const seedDataPath = path.resolve(__dirname, "../data/seedData.json");
  const rawData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));
  const users = rawData.users.map((user) => ({
    _id: new ObjectId(user._id),
    name: user.name,
    walletAddress: user.walletAddress ? user.walletAddress.toLowerCase().trim() : null,
    telegramId: user.telegramId ? String(user.telegramId).trim() : null,
    availableBalance: Long.fromNumber(user.availableBalance),
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt)
  }));
  const collections = rawData.collections.map((col) => ({
    _id: new ObjectId(col._id),
    name: col.name.trim(),
    creatorId: new ObjectId(col.creatorId),
    platformFeeBps: new Int32(col.platformFeeBps),
    royaltyFeeBps: new Int32(col.royaltyFeeBps),
    createdAt: new Date(col.createdAt),
    updatedAt: new Date(col.updatedAt)
  }));
  const nfts = rawData.nfts.map((nft) => ({
    _id: new ObjectId(nft._id),
    collectionId: new ObjectId(nft.collectionId),
    ownerId: new ObjectId(nft.ownerId),
    tokenId: new Int32(nft.tokenId),
    name: nft.name.trim(),
    status: nft.status,
    isLocked: Boolean(nft.isLocked),
    createdAt: new Date(nft.createdAt),
    updatedAt: new Date(nft.updatedAt)
  }));
  console.log("\nSeeding data...");
  await db.collection(COLLECTIONS.USERS).deleteMany({});
  await db.collection(COLLECTIONS.COLLECTIONS).deleteMany({});
  await db.collection(COLLECTIONS.NFTS).deleteMany({});
  await db.collection(COLLECTIONS.OFFERS).deleteMany({});
  await db.collection(COLLECTIONS.ESCROW_ACCOUNTS).deleteMany({});
  await db.collection(COLLECTIONS.LEDGER_ENTRIES).deleteMany({});
  const userResult = await db.collection(COLLECTIONS.USERS).insertMany(users);
  console.log(`Inserted ${userResult.insertedCount} users`);
  const collectionResult = await db.collection(COLLECTIONS.COLLECTIONS).insertMany(collections);
  console.log(`Inserted ${collectionResult.insertedCount} collections`);
  const nftResult = await db.collection(COLLECTIONS.NFTS).insertMany(nfts);
  console.log(`Inserted ${nftResult.insertedCount} NFTs`);
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
