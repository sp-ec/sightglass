import { authUser } from "@/modules/auth/auth.types";

// Populated by requireAuth; left optional so handlers narrow it explicitly
declare global {
	namespace Express {
		interface Request {
			user?: authUser;
		}
	}
}

export {};
