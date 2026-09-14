"use client";

import * as React from "react";
import { z } from "zod";
import { postJson, readErrorMessage } from "@/lib/api";

// Mirrors the server's validation rules in auth.service.ts. bcrypt truncates at
// 72 bytes, so the server rejects anything longer rather than silently cutting.
export const emailSchema = z
	.string()
	.trim()
	.min(1, "Email is required")
	.max(255, "Email is too long")
	.refine((value) => /^[^\s@]+@[^\s@]+$/.test(value), "Enter a valid email address");

export const usernameSchema = z
	.string()
	.trim()
	.min(3, "Username must be at least 3 characters")
	.max(50, "Username must be at most 50 characters")
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"Username may only contain letters, numbers, hyphens and underscores",
	);

export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(72, "Password must be at most 72 characters");

// Shared by /setup and /signup, which submit the same shape
export const registrationSchema = z
	.object({
		email: emailSchema,
		username: usernameSchema,
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((values) => values.password === values.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const credentialsSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Password is required"),
});

type UseAuthFormOptions = {
	initialValues: Record<string, string>;
	schema: z.ZodType<Record<string, unknown>>;
	path: string;
	fallbackError: string;
	onSuccess: () => Promise<void> | void;
};

export const useAuthForm = ({
	initialValues,
	schema,
	path,
	fallbackError,
	onSuccess,
}: UseAuthFormOptions) => {
	const [values, setValues] = React.useState(initialValues);
	const [errors, setErrors] = React.useState<Record<string, string>>({});
	const [formError, setFormError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);

	const onChange = React.useCallback((name: string, value: string) => {
		setValues((current) => ({ ...current, [name]: value }));
		setErrors((current) => {
			if (!current[name]) {
				return current;
			}

			const next = { ...current };
			delete next[name];
			return next;
		});
	}, []);

	const onSubmit = React.useCallback(async () => {
		setFormError(null);

		const parsed = schema.safeParse(values);
		if (!parsed.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const key = String(issue.path[0] ?? "");
				if (key && !fieldErrors[key]) {
					fieldErrors[key] = issue.message;
				}
			}

			setErrors(fieldErrors);
			return;
		}

		setErrors({});
		setSubmitting(true);

		try {
			// confirmPassword is a client-only check and is not sent
			const payload = { ...(parsed.data as Record<string, unknown>) };
			delete payload.confirmPassword;
			const response = await postJson(path, payload);

			if (!response.ok) {
				setFormError(await readErrorMessage(response, fallbackError));
				return;
			}

			await onSuccess();
		} catch {
			setFormError(fallbackError);
		} finally {
			setSubmitting(false);
		}
	}, [schema, values, path, fallbackError, onSuccess]);

	return { values, errors, formError, submitting, onChange, onSubmit };
};
