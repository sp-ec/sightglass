import { Request, Response } from "express";
import {
	clearSessionCookies,
	readSessionToken,
	setSessionCookies,
} from "@/modules/auth/auth.cookie";
import {
	authenticate,
	endSession,
	getAuthStatus,
	registerInitialAdmin,
	registerUser,
} from "@/modules/auth/auth.service";
import { registerOutcome } from "@/modules/auth/auth.types";

// Shared by setup and signup: both create an account, open a session and
// differ only in which service produced the outcome
const respondToRegistration = (res: Response, outcome: registerOutcome) => {
	switch (outcome.status) {
		case "created":
			setSessionCookies(res, outcome.session);
			return res.status(201).json({ user: outcome.session.user });
		case "invalid":
			return res.status(400).json({ message: outcome.message });
		case "forbidden":
			return res.status(403).json({ message: outcome.message });
		case "conflict":
			return res.status(409).json({ message: outcome.message });
	}
};

export const getInitStatus = async (req: Request, res: Response) => {
	try {
		const result = await getAuthStatus();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to read initialization status",
		});
	}
};

export const setupAdmin = async (req: Request, res: Response) => {
	try {
		const outcome = await registerInitialAdmin(req.body);
		return respondToRegistration(res, outcome);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to create administrator account",
		});
	}
};

export const signup = async (req: Request, res: Response) => {
	try {
		const outcome = await registerUser(req.body);
		return respondToRegistration(res, outcome);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to create account",
		});
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const outcome = await authenticate(req.body);
		if (outcome.status === "rejected") {
			// Identical message for an unknown email and a wrong password so the
			// response cannot be used to enumerate accounts
			return res.status(401).json({ message: "Invalid email or password" });
		}

		setSessionCookies(res, outcome.session);
		return res.status(200).json({ user: outcome.session.user });
	} catch (error) {
		return res.status(500).json({
			message: "Failed to sign in",
		});
	}
};

// Idempotent: succeeds whether or not a session cookie was sent
export const logout = async (req: Request, res: Response) => {
	try {
		const token = readSessionToken(req);
		if (token) {
			await endSession(token);
		}

		clearSessionCookies(res);
		return res.status(204).send();
	} catch (error) {
		clearSessionCookies(res);
		return res.status(204).send();
	}
};

export const getMe = async (req: Request, res: Response) => {
	if (!req.user) {
		return res.status(401).json({ message: "Not authenticated" });
	}

	return res.status(200).json({ user: req.user });
};
