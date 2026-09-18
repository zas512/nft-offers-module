import { LedgerEntry } from "../models/index.js";
import type { ILedgerEntry, LedgerFilterQuery } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class LedgerService {
  public async getAllLedgerEntries(filter: LedgerFilterQuery = {}): Promise<ILedgerEntry[]> {
    return LedgerEntry.find(filter).lean<ILedgerEntry[]>();
  }

  public async getLedgerEntryById(id: string): Promise<ILedgerEntry> {
    const entry = await LedgerEntry.findById(id).lean<ILedgerEntry | null>();
    if (!entry) {
      throw AppError.notFound("Ledger entry not found");
    }
    return entry;
  }
}

export const ledgerService = new LedgerService();
