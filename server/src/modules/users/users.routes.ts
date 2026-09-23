import express from "express";
import {
	deleteUser,
	getUsersList,
	putUserRole,
} from "@/modules/users/users.controller";

const userRoutes = express.Router();

// The literal path stays above the /:id routes, which would otherwise swallow it
userRoutes.get("/list", getUsersList);
userRoutes.put("/:id/role", putUserRole);
userRoutes.delete("/:id", deleteUser);

export default userRoutes;
