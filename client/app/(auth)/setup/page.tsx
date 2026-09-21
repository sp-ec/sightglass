"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/components/auth/auth-provider";
import { registrationSchema, useAuthForm } from "@/components/auth/use-auth-form";
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

export default function SetupPage() {
	const router = useRouter();
	const { refresh } = useAuth();
	const { checking } = useInitStatus(false, "/login");

	const form = useAuthForm({
		initialValues: {
			email: "",
			username: "",
			password: "",
			confirmPassword: "",
		},
		schema: registrationSchema,
		path: "/auth/setup",
		fallbackError: "Failed to create the administrator account",
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

	return (
		<AuthForm
			title="Create the administrator account"
			description="This is a one-time setup. The first account created becomes the administrator, and this screen is then permanently disabled."
			fields={fields}
			submitLabel="Create administrator"
			footer={
				<p className="text-center text-sm text-muted-foreground">
					Already set up?{" "}
					<Link href="/login" className="underline underline-offset-4">
						Sign in
					</Link>
				</p>
			}
			{...form}
		/>
	);
}
