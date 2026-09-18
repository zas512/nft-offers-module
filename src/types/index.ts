import type { Int32, Long, ObjectId } from "mongodb";

export const OFFER_TYPES = ["item", "collection"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_STATUSES = [
  "pending",
  "accepted",
  "cancelled",
  "expired",
  "invalidated"
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export const ESCROW_STATUSES = ["held", "settled", "refunded", "cancelled"] as const;
export type EscrowStatus = (typeof ESCROW_STATUSES)[number];
export const NFT_STATUSES = ["active", "listed", "burned", "transferred"] as const;
export type NftStatus = (typeof NFT_STATUSES)[number];
export const LEDGER_DIRECTIONS = ["credit", "debit"] as const;
export type LedgerDirection = (typeof LEDGER_DIRECTIONS)[number];
export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}
export interface IUser extends ITimestamps {
  _id: ObjectId;
  name: string;
  walletAddress: string | null;
  telegramId: string | null;
  availableBalance: Long;
}
export interface ICollection extends ITimestamps {
  _id: ObjectId;
  name: string;
  creatorId: ObjectId;
  platformFeeBps: Int32;
  royaltyFeeBps: Int32;
}
export interface INft extends ITimestamps {
  _id: ObjectId;
  collectionId: ObjectId;
  ownerId: ObjectId;
  tokenId: Int32;
  name: string;
  status: NftStatus;
  isLocked: boolean;
}
export interface IOffer extends ITimestamps {
  _id: ObjectId;
  buyerId: ObjectId;
  escrowId: ObjectId;
  collectionId: ObjectId;
  nftId: ObjectId | null;
  type: OfferType;
  grossAmountGrams: Long;
  status: OfferStatus;
  expiresAt: Date;
}
export interface IEscrowAccount extends ITimestamps {
  _id: ObjectId;
  offerId: ObjectId;
  buyerId: ObjectId;
  sellerId: ObjectId | null;
  creatorId: ObjectId | null;
  grossAmountGrams: Long;
  platformFeeBps: Int32;
  royaltyFeeBps: Int32;
  status: EscrowStatus;
  settledAt: Date | null;
  feeConfig?: {
    platformFeeBps?: number;
    royaltyFeeBps?: number;
    creatorId?: ObjectId | null;
  };
}
export interface ILedgerEntry {
  _id: ObjectId;
  referenceId: ObjectId;
  userId: ObjectId | null;
  account: string;
  type: string;
  direction: LedgerDirection;
  amountGrams: Long;
  createdAt: Date;
}
export interface CreateUserInput {
  name: string;
  walletAddress?: string | null;
  telegramId?: string | null;
  initialBalanceGrams?: number;
}
export interface CreateCollectionInput {
  name: string;
  creatorId: string | ObjectId;
  platformFeeBps?: number;
  royaltyFeeBps?: number;
}
export interface CreateNftInput {
  collectionId: string | ObjectId;
  ownerId: string | ObjectId;
  tokenId: number;
  name: string;
  status?: NftStatus;
  isLocked?: boolean;
}
export interface CreateSingleItemOfferInput {
  buyerId: string;
  nftId: string;
  grossAmountGrams: number;
  expiresAt: string | Date;
}
export interface AcceptSingleItemOfferInput {
  offerId: string;
  sellerId: string;
}
type sellerId = string | ObjectId | null;
export interface CreateEscrowInput {
  offerId: string | ObjectId;
  buyerId: string | ObjectId;
  sellerId?: sellerId;
  creatorId?: string | ObjectId | null;
  grossAmountGrams: number;
  platformFeeBps?: number;
  royaltyFeeBps?: number;
  status?: EscrowStatus;
  settledAt?: Date | null;
}
export interface CreateLedgerInput {
  referenceId: string | ObjectId;
  userId?: string | ObjectId | null;
  account: string;
  type: string;
  direction: LedgerDirection;
  amountGrams: number;
}
export interface NftFilterQuery {
  collectionId?: string;
  ownerId?: string;
  status?: NftStatus;
}
export interface OfferFilterQuery {
  buyerId?: string;
  collectionId?: string;
  nftId?: string;
  status?: OfferStatus;
}
export interface SingleItemOfferResult {
  offerId: string;
  escrowId: string;
  buyerId: string;
  sellerId: string;
  collectionId: string;
  nftId: string;
  grossAmountGrams: number;
  status: OfferStatus;
  expiresAt: string;
}
export interface OfferSettlementSummary {
  offerId: string;
  nftId: string;
  buyerId: string;
  sellerId: string;
  grossAmountGrams: string;
  netPayoutGrams: string;
  platformFeeGrams: string;
  royaltyFeeGrams: string;
  invalidatedOffersCount: number;
}
