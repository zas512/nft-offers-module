export * from "./collectionModel.js";
export * from "./escrowModel.js";
export * from "./ledgerModel.js";
export * from "./nftModel.js";
export * from "./offerModel.js";
export * from "./userModel.js";

export const COLLECTIONS = Object.freeze({
  USERS: "users",
  COLLECTIONS: "collections",
  NFTS: "nfts",
  OFFERS: "offers",
  ESCROW_ACCOUNTS: "escrow_accounts",
  LEDGER_ENTRIES: "ledger_entries"
});
