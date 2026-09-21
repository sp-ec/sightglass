"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// The proxy cannot know whether the app has been initialized without a network
// call, so the auth pages resolve it themselves and redirect to the right one.
type initStatus = { checking: boolean; registrationEnabled: boolean };

export const useInitStatus = (
	expected: boolean,
	redirectTo: string,
): initStatus => {
	const [checking, setChecking] = React.useState(true);
	// Defaults open so a failed fetch never hides a working sign-up form; the
	// server rejects the submission either way
	const [registrationEnabled, setRegistrationEnabled] = React.useState(true);
	const router = useRouter();

	React.useEffect(() => {
		let active = true;

		const loadStatus = async () => {
			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/auth/status`,
				);
				if (!response.ok) {
					throw new Error("Failed to read initialization status");
				}

				const body = (await response.json()) as {
					initialized: boolean;
					registrationEnabled: boolean;
				};
				if (!active) {
					return;
				}

				if (body.initialized !== expected) {
					router.replace(redirectTo);
					return;
				}

				setRegistrationEnabled(body.registrationEnabled);
				setChecking(false);
			} catch {
				// Let the page render; the server rejects the submission if it is
				// in the wrong state anyway
				if (active) {
					setChecking(false);
				}
			}
		};

		void loadStatus();

		return () => {
			active = false;
		};
	}, [expected, redirectTo, router]);

	return { checking, registrationEnabled };
};
