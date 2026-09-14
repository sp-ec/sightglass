"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { credentialsSchema, useAuthForm } from "@/components/auth/use-auth-form";
import { useInitStatus } from "@/components/auth/use-init-status";
import { Spinner } from "@/components/ui/spinner";

const fields = [
	{
		name: "email",
		label: "Email",
		type: "email" as const,
		autoComplete: "email",
	},
	{
		name: "password",
		label: "Password",
		type: "password" as const,
		autoComplete: "current-password",
	},
];

// Only same-origin paths are accepted, so "?next=https://evil.com" and
// protocol-relative "//evil.com" cannot turn this into an open redirect
const safeRedirect = (value: string | null): string => {
	if (!value || !value.startsWith("/") || value.startsWith("//")) {
		return "/";
	}

	return value;
};

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { refresh } = useAuth();
	const checking = useInitStatus(true, "/setup");

	const form = useAuthForm({
		initialValues: { email: "", password: "" },
		schema: credentialsSchema,
		path: "/auth/login",
		fallbackError: "Failed to sign in",
		onSuccess: async () => {
			await refresh();
			router.replace(safeRedirect(searchParams.get("next")));
		},
	});

	if (checking) {
		return (
			<div className="flex justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<AuthForm
			title="Sign in"
			description="Welcome back to SteamScope."
			fields={fields}
			submitLabel="Sign in"
			footer={
				<p className="text-center text-sm text-muted-foreground">
					Need an account?{" "}
					<Link href="/signup" className="underline underline-offset-4">
						Sign up
					</Link>
				</p>
			}
			{...form}
		/>
	);
}

export default function LoginPage() {
	// useSearchParams needs a Suspense boundary or the production build fails
	return (
		<Suspense
			fallback={
				<div className="flex justify-center">
					<Spinner />
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
