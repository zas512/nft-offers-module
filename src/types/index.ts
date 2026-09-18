import type mongoose from "mongoose";
import type { Types } from "mongoose";

export const OFFER_TYPES = ["item", "collection"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
  "expired",
  "invalidated"
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const ESCROW_STATUSES = ["held", "settled", "refunded", "cancelled"] as const;
export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export const NFT_STATUSES = ["active", "listed", "burned", "transferred"] as const;
export type NftStatus = (typeof NFT_STATUSES)[number];

export const BPS_DENOMINATOR = 10000n;

export const LEDGER_ACCOUNTS = ["available", "treasury"] as const;
export type LedgerAccount = (typeof LEDGER_ACCOUNTS)[number];

export const LEDGER_TYPES = [
  "escrow_lock",
  "seller_payout",
  "platform_fee",
  "royalty_fee",
  "escrow_refund"
] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const LEDGER_DIRECTIONS = ["credit", "debit"] as const;
export type LedgerDirection = (typeof LEDGER_DIRECTIONS)[number];

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends ITimestamps {
  _id: Types.ObjectId;
  name: string;
  walletAddress: string | null;
  telegramId: string | null;
  availableBalance: number | mongoose.mongo.Long;
}

export interface ICollection extends ITimestamps {
  _id: Types.ObjectId;
  name: string;
}

export interface INft extends ITimestamps {
  _id: Types.ObjectId;
  collectionId: Types.ObjectId;
  ownerId: Types.ObjectId;
  tokenId: number;
  name: string;
  status: NftStatus;
  isLocked: boolean;
}

export interface IOffer extends ITimestamps {
  _id: Types.ObjectId;
  buyerId: Types.ObjectId;
  escrowId: Types.ObjectId;
  collectionId: Types.ObjectId;
  nftId: Types.ObjectId | null;
  type: OfferType;
  grossAmountGrams: number | mongoose.mongo.Long;
  status: OfferStatus;
  expiresAt: Date;
}

export interface IEscrowAccount extends ITimestamps {
  _id: Types.ObjectId;
  offerId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId | null;
  grossAmountGrams: number | mongoose.mongo.Long;
  platformFeeBps: number;
  royaltyFeeBps: number;
  status: EscrowStatus;
  settledAt: Date | null;
}

export interface ILedgerEntry {
  _id: Types.ObjectId;
  referenceId: Types.ObjectId;
  userId: Types.ObjectId | null;
  account: LedgerAccount;
  type: LedgerType;
  direction: LedgerDirection;
  amountGrams: number | mongoose.mongo.Long;
  createdAt: Date;
}

export interface CreateSingleItemOfferInput {
  buyerId: Types.ObjectId | string;
  nftId: Types.ObjectId | string;
  grossAmountGrams: number | string | bigint;
  expiresAt: string | Date;
}

export interface AcceptSingleItemOfferInput {
  offerId: Types.ObjectId | string;
  sellerId: Types.ObjectId | string;
  nftId?: Types.ObjectId | string;
}

export interface RejectSingleItemOfferInput {
  offerId: Types.ObjectId | string;
  sellerId: Types.ObjectId | string;
  nftId?: Types.ObjectId | string;
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

export interface EscrowFilterQuery {
  offerId?: string;
  buyerId?: string;
  sellerId?: string;
  status?: EscrowStatus;
}

export interface LedgerFilterQuery {
  referenceId?: string;
  userId?: string;
  account?: LedgerAccount;
  type?: LedgerType;
  direction?: LedgerDirection;
}

export interface SingleItemOfferResult {
  offerId: string;
  escrowId: string;
  buyerId: string;
  sellerId: string;
  collectionId: string;
  nftId: string;
  grossAmountGrams: string;
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

export interface OfferRejectionSummary {
  offerId: string;
  nftId: string;
  buyerId: string;
  sellerId: string;
  refundedAmountGrams: string;
  status: "rejected";
}

export interface UserOffersResult {
  made: IOffer[];
  received: IOffer[];
}
