"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export type AuthField = {
	name: string;
	label: string;
	type: "text" | "email" | "password";
	autoComplete?: string;
	placeholder?: string;
};

type AuthFormProps = {
	title: string;
	description: string;
	fields: AuthField[];
	values: Record<string, string>;
	errors: Record<string, string>;
	formError: string | null;
	submitting: boolean;
	submitLabel: string;
	onChange: (name: string, value: string) => void;
	onSubmit: () => void;
	footer?: React.ReactNode;
};

export function AuthForm({
	title,
	description,
	fields,
	values,
	errors,
	formError,
	submitting,
	submitLabel,
	onChange,
	onSubmit,
	footer,
}: AuthFormProps) {
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onSubmit();
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} noValidate>
					<FieldGroup>
						{fields.map((field) => (
							<Field key={field.name} data-invalid={Boolean(errors[field.name])}>
								<FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type={field.type}
									autoComplete={field.autoComplete}
									placeholder={field.placeholder}
									value={values[field.name] ?? ""}
									onChange={(event) => onChange(field.name, event.target.value)}
									aria-invalid={Boolean(errors[field.name])}
									disabled={submitting}
								/>
								{errors[field.name] && (
									<FieldError>{errors[field.name]}</FieldError>
								)}
							</Field>
						))}

						{formError && (
							<p className="text-sm text-destructive" role="alert">
								{formError}
							</p>
						)}

						<Button type="submit" disabled={submitting} className="w-full">
							{submitting && <Spinner />}
							{submitLabel}
						</Button>

						{footer}
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
}
