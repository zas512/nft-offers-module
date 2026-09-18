import { Router } from "express";
import { getEscrow, getEscrows } from "../controllers/index.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { escrowFilterQuerySchema, idParamSchema } from "../validations/index.js";

const router = Router();

router.get("/", validate({ query: escrowFilterQuerySchema }), getEscrows);
router.get("/:id", validate({ params: idParamSchema }), getEscrow);

export default router;
