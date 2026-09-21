"use client";

import * as React from "react";
import { z } from "zod";
import { putJson, readErrorMessage } from "@/lib/api";
import type {
	appSettingsSection,
	appSettingsView,
} from "../app-settings-types";

type useAppSettingsSectionOptions<TForm, TPayload> = {
	section: appSettingsSection;
	// null while the page is still loading
	initial: TForm | null;
	schema: z.ZodType<TForm>;
	// Strips ui-only fields before the payload goes to the server
	toPayload: (value: TForm) => TPayload;
	onSaved: (saved: appSettingsView) => void;
	// The API tab's form never mirrors server state, so it resets to a constant
	afterSave?: (value: TForm) => TForm;
};

export type appSettingsSectionState<TForm> = {
	value: TForm | null;
	update: (updater: (current: TForm) => TForm) => void;
	dirty: boolean;
	errors: Record<string, string>;
	formError: string | null;
	saving: boolean;
	saved: boolean;
	save: () => Promise<void>;
};

const SAVED_FLASH_MS = 2000;

export const useAppSettingsSection = <TForm, TPayload>({
	section,
	initial,
	schema,
	toPayload,
	onSaved,
	afterSave,
}: useAppSettingsSectionOptions<TForm, TPayload>): appSettingsSectionState<TForm> => {
	const [value, setValue] = React.useState<TForm | null>(initial);
	const [errors, setErrors] = React.useState<Record<string, string>>({});
	const [formError, setFormError] = React.useState<string | null>(null);
	const [saving, setSaving] = React.useState(false);
	const [saved, setSaved] = React.useState(false);

	// Structural comparison is correct here: these are small plain objects
	// always built from the same literal shape, so key order is stable
	const baselineRef = React.useRef<string>(JSON.stringify(initial));

	React.useEffect(() => {
		if (initial === null) {
			return;
		}

		// Only adopt server state while the admin has no unsaved edits
		setValue((current) => {
			if (current !== null && JSON.stringify(current) !== baselineRef.current) {
				return current;
			}

			baselineRef.current = JSON.stringify(initial);
			return initial;
		});
	}, [initial]);

	const update = React.useCallback((updater: (current: TForm) => TForm) => {
		setSaved(false);
		setValue((current) => (current === null ? current : updater(current)));
	}, []);

	const dirty =
		value !== null && JSON.stringify(value) !== baselineRef.current;

	const save = React.useCallback(async () => {
		if (value === null) {
			return;
		}

		setFormError(null);

		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				// Nested and array paths need the full path, unlike use-auth-form:
				// "tagMultipliers.2.mult" must resolve to that one row
				const key = issue.path.join(".");
				if (key && !fieldErrors[key]) {
					fieldErrors[key] = issue.message;
				}
			}

			setErrors(fieldErrors);
			return;
		}

		setErrors({});
		setSaving(true);

		try {
			const response = await putJson("/app-settings", {
				section,
				value: toPayload(parsed.data),
			});

			if (!response.ok) {
				setFormError(
					await readErrorMessage(response, "Failed to save app settings"),
				);
				return;
			}

			const body = (await response.json()) as appSettingsView;
			const next = afterSave ? afterSave(parsed.data) : parsed.data;
			baselineRef.current = JSON.stringify(next);
			setValue(next);
			onSaved(body);
			setSaved(true);
		} catch {
			setFormError("Failed to save app settings");
		} finally {
			setSaving(false);
		}
	}, [value, schema, section, toPayload, onSaved, afterSave]);

	React.useEffect(() => {
		if (!saved) {
			return;
		}

		const timer = window.setTimeout(() => setSaved(false), SAVED_FLASH_MS);
		return () => window.clearTimeout(timer);
	}, [saved]);

	return { value, update, dirty, errors, formError, saving, saved, save };
};
