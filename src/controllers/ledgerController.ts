import type { Request, Response } from "express";
import { ledgerService } from "../services/index.js";
import type { LedgerFilterQuery } from "../types/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class LedgerController {
  public getLedgerEntries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const entries = await ledgerService.getAllLedgerEntries(req.query as LedgerFilterQuery);
    res.status(200).json({ success: true, count: entries.length, data: entries });
  });

  public getLedgerEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const entry = await ledgerService.getLedgerEntryById(String(req.params.id));
    res.status(200).json({ success: true, data: entry });
  });
}

export const ledgerController = new LedgerController();
export const getLedgerEntries = ledgerController.getLedgerEntries;
export const getLedgerEntry = ledgerController.getLedgerEntry;
