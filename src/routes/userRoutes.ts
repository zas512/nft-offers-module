import { Router } from "express";
import { getUser, getUsers, getUsersWithNfts } from "../controllers/userController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { userParamSchema } from "../validations/userValidation.js";

const router = Router();

router.get("/", getUsers);
router.get("/with-nfts", getUsersWithNfts);
router.get("/:id", validate({ params: userParamSchema }), getUser);

export default router;
