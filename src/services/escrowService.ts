import { EscrowAccount } from "../models/index.js";
import type { EscrowFilterQuery, IEscrowAccount } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class EscrowService {
  public async getAllEscrows(filter: EscrowFilterQuery = {}): Promise<IEscrowAccount[]> {
    return EscrowAccount.find(filter).lean<IEscrowAccount[]>();
  }

  public async getEscrowById(id: string): Promise<IEscrowAccount> {
    const escrow = await EscrowAccount.findById(id).lean<IEscrowAccount | null>();
    if (!escrow) {
      throw AppError.notFound("Escrow account not found");
    }
    return escrow;
  }
}

export const escrowService = new EscrowService();
