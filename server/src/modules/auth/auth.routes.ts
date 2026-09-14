import express from "express";
import {
	getInitStatus,
	getMe,
	login,
	logout,
	setupAdmin,
	signup,
} from "@/modules/auth/auth.controller";
import { requireAuth } from "@/modules/auth/auth.middleware";

const authRoutes = express.Router();

authRoutes.get("/status", getInitStatus);
authRoutes.post("/setup", setupAdmin);
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuth, getMe);

export default authRoutes;
