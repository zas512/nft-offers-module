import type { Types } from "mongoose";

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
  _id: Types.ObjectId;
  name: string;
  walletAddress: string | null;
  telegramId: string | null;
  availableBalance: number;
}

export interface ICollection extends ITimestamps {
  _id: Types.ObjectId;
  name: string;
  creatorId: Types.ObjectId;
  platformFeeBps: number;
  royaltyFeeBps: number;
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
  grossAmountGrams: number;
  status: OfferStatus;
  expiresAt: Date;
}

export interface IEscrowAccount extends ITimestamps {
  _id: Types.ObjectId;
  offerId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId | null;
  creatorId: Types.ObjectId | null;
  grossAmountGrams: number;
  platformFeeBps: number;
  royaltyFeeBps: number;
  status: EscrowStatus;
  settledAt: Date | null;
  feeConfig?: {
    platformFeeBps?: number;
    royaltyFeeBps?: number;
    creatorId?: Types.ObjectId | null;
  };
}

export interface ILedgerEntry {
  _id: Types.ObjectId;
  referenceId: Types.ObjectId;
  userId: Types.ObjectId | null;
  account: string;
  type: string;
  direction: LedgerDirection;
  amountGrams: number;
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
  creatorId: string | Types.ObjectId;
  platformFeeBps?: number;
  royaltyFeeBps?: number;
}

export interface CreateNftInput {
  collectionId: string | Types.ObjectId;
  ownerId: string | Types.ObjectId;
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

export type SellerIdType = string | Types.ObjectId | null;

export interface CreateEscrowInput {
  offerId: string | Types.ObjectId;
  buyerId: string | Types.ObjectId;
  sellerId?: SellerIdType;
  creatorId?: string | Types.ObjectId | null;
  grossAmountGrams: number;
  platformFeeBps?: number;
  royaltyFeeBps?: number;
  status?: EscrowStatus;
  settledAt?: Date | null;
}

export interface CreateLedgerInput {
  referenceId: string | Types.ObjectId;
  userId?: string | Types.ObjectId | null;
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
