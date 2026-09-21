"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { registrationSchema, useAuthForm } from "@/components/auth/use-auth-form";
import { useInitStatus } from "@/components/auth/use-init-status";
import { Spinner } from "@/components/ui/spinner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const fields = [
	{
		name: "email",
		label: "Email",
		type: "email" as const,
		autoComplete: "email",
	},
	{
		name: "username",
		label: "Username",
		type: "text" as const,
		autoComplete: "username",
	},
	{
		name: "password",
		label: "Password",
		type: "password" as const,
		autoComplete: "new-password",
	},
	{
		name: "confirmPassword",
		label: "Confirm password",
		type: "password" as const,
		autoComplete: "new-password",
	},
];

export default function SignupPage() {
	const router = useRouter();
	const { refresh } = useAuth();
	const { checking, registrationEnabled } = useInitStatus(true, "/setup");

	const form = useAuthForm({
		initialValues: {
			email: "",
			username: "",
			password: "",
			confirmPassword: "",
		},
		schema: registrationSchema,
		path: "/auth/signup",
		fallbackError: "Failed to create your account",
		onSuccess: async () => {
			await refresh();
			router.replace("/");
		},
	});

	if (checking) {
		return (
			<div className="flex justify-center">
				<Spinner />
			</div>
		);
	}

	if (!registrationEnabled) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Sign-ups are currently disabled</CardTitle>
					<CardDescription>
						An administrator has closed new registrations for this app.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Link href="/login" className="underline underline-offset-4">
						Back to sign in
					</Link>
				</CardContent>
			</Card>
		);
	}

	return (
		<AuthForm
			title="Create an account"
			description="Sign up to explore the Steam market database."
			fields={fields}
			submitLabel="Sign up"
			footer={
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="underline underline-offset-4">
						Sign in
					</Link>
				</p>
			}
			{...form}
		/>
	);
}
