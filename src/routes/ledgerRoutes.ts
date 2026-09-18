import { Router } from "express";
import { getLedgerEntries, getLedgerEntry } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { idParamSchema, ledgerFilterQuerySchema } from "../validations/index.js";

const router = Router();

router.get("/", validate({ query: ledgerFilterQuerySchema }), getLedgerEntries);
router.get("/:id", validate({ params: idParamSchema }), getLedgerEntry);

export default router;
