"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, postJson } from "@/lib/api";

export type AuthUser = {
	id: number;
	email: string;
	username: string;
	role: "admin" | "user";
	created_at: string;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
	user: AuthUser | null;
	status: AuthStatus;
	refresh: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

// Pages that render without a session; kept in sync with proxy.ts
const publicPaths = ["/login", "/signup", "/setup"];

const isPublicPath = (pathname: string) =>
	publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

// Kept free of setState so it can be awaited from an effect without the
// caller cascading renders before the response lands
const fetchSession = async (): Promise<AuthUser | null> => {
	try {
		const response = await apiFetch("/auth/me");
		if (!response.ok) {
			return null;
		}

		const body = (await response.json()) as { user: AuthUser };
		return body.user;
	} catch {
		// A 401 is the normal outcome for an anonymous visitor, not an error
		return null;
	}
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = React.useState<AuthUser | null>(null);
	const [status, setStatus] = React.useState<AuthStatus>("loading");
	const router = useRouter();
	const pathname = usePathname();

	const refresh = React.useCallback(async () => {
		const nextUser = await fetchSession();
		setUser(nextUser);
		setStatus(nextUser ? "authenticated" : "unauthenticated");
	}, []);

	const logout = React.useCallback(async () => {
		try {
			await postJson("/auth/logout", {});
		} finally {
			setUser(null);
			setStatus("unauthenticated");
			// A full navigation so the proxy re-evaluates with the cleared cookie
			window.location.assign("/login");
		}
	}, []);

	React.useEffect(() => {
		let active = true;

		const loadSession = async () => {
			const nextUser = await fetchSession();
			if (!active) {
				return;
			}

			setUser(nextUser);
			setStatus(nextUser ? "authenticated" : "unauthenticated");
		};

		void loadSession();

		return () => {
			active = false;
		};
	}, []);

	// Covers a session expiring while the tab sits open: the proxy only runs on
	// navigation, so nothing else would notice
	React.useEffect(() => {
		if (status === "unauthenticated" && !isPublicPath(pathname)) {
			router.replace("/login");
		}
	}, [status, pathname, router]);

	const value = React.useMemo(
		() => ({ user, status, refresh, logout }),
		[user, status, refresh, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = React.useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
