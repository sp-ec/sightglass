import { Request, Response } from "express";
import {
	changeUserRole,
	fetchUsersList,
	removeUser,
} from "@/modules/users/users.service";

export const getUsersList = async (req: Request, res: Response) => {
	try {
		const result = await fetchUsersList(req.query.page as string | undefined);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ message: "Failed to list users" });
	}
};

export const putUserRole = async (req: Request, res: Response) => {
	try {
		// requireAuth always sets this; narrowing it keeps the actor id honest
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const outcome = await changeUserRole(
			req.user.id,
			req.params.id as string,
			req.body,
		);

		switch (outcome.status) {
			case "ok":
				return res.status(200).json({ user: outcome.user });
			case "invalid":
				return res.status(400).json({ message: outcome.message });
			case "forbidden":
				return res.status(403).json({ message: outcome.message });
			case "not_found":
				return res.status(404).json({ message: "User not found" });
			case "conflict":
				return res.status(409).json({ message: outcome.message });
		}
	} catch (error) {
		return res.status(500).json({ message: "Failed to update user role" });
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const outcome = await removeUser(req.user.id, req.params.id as string);

		switch (outcome.status) {
			case "deleted":
				return res.status(204).send();
			case "invalid":
				return res.status(400).json({ message: outcome.message });
			case "forbidden":
				return res.status(403).json({ message: outcome.message });
			case "not_found":
				return res.status(404).json({ message: "User not found" });
			case "conflict":
				return res.status(409).json({ message: outcome.message });
		}
	} catch (error) {
		return res.status(500).json({ message: "Failed to delete user" });
	}
};
