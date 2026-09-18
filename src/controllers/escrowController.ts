import type { Request, Response } from "express";
import { escrowService } from "../services/index.js";
import type { EscrowFilterQuery } from "../types/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class EscrowController {
  public getEscrows = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const escrows = await escrowService.getAllEscrows(req.query as EscrowFilterQuery);
    res.status(200).json({ success: true, count: escrows.length, data: escrows });
  });

  public getEscrow = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const escrow = await escrowService.getEscrowById(String(req.params.id));
    res.status(200).json({ success: true, data: escrow });
  });
}

export const escrowController = new EscrowController();
export const getEscrows = escrowController.getEscrows;
export const getEscrow = escrowController.getEscrow;
