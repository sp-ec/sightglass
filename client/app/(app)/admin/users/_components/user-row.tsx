"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { putJson, readErrorMessage } from "@/lib/api";
import { DeleteUserDialog } from "./delete-user-dialog";
import type { UserListItem, UserRole } from "../users-types";

const SAVED_FLASH_MS = 2000;

const formatDate = (value: string): string =>
	new Date(value).toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

interface Props {
	user: UserListItem;
	isSelf: boolean;
	onChanged: () => void;
	onDeleted: () => void;
}

export function UserRow({ user, isSelf, onChanged, onDeleted }: Props) {
	// null means "no local edit", so the row needs no effect to re-adopt the
	// server's role after a save: the reload updates user.role and the pending
	// value stops counting as dirty on its own
	const [pendingRole, setPendingRole] = React.useState<UserRole | null>(null);
	const [saving, setSaving] = React.useState(false);
	const [saved, setSaved] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = React.useState(false);

	React.useEffect(() => {
		if (!saved) {
			return;
		}

		const timer = window.setTimeout(() => setSaved(false), SAVED_FLASH_MS);
		return () => window.clearTimeout(timer);
	}, [saved]);

	const displayRole = pendingRole ?? user.role;
	// Compared against the server's value, so toggling away and back disables Save
	const dirty = displayRole !== user.role;

	const save = async () => {
		setError(null);
		setSaving(true);

		try {
			const response = await putJson(`/users/${user.id}/role`, {
				role: displayRole,
			});

			if (!response.ok) {
				setError(await readErrorMessage(response, "Failed to update role"));
				return;
			}

			setSaved(true);
			onChanged();
		} catch {
			setError("Failed to update role");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card className="p-0">
			<div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate font-medium">{user.username}</h3>
						{/* Explains why this row's controls are disabled */}
						{isSelf && <Badge variant="secondary">You</Badge>}
					</div>
					<p className="truncate text-sm text-muted-foreground">{user.email}</p>
					<p className="text-sm text-muted-foreground">
						Joined {formatDate(user.created_at)}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{/* No select component is installed; a ButtonGroup with the active
					    side disabled is the existing toggle pattern */}
					<ButtonGroup>
						<Button
							variant="outline"
							size="sm"
							disabled={isSelf || saving || displayRole === "user"}
							onClick={() => setPendingRole("user")}
						>
							User
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={isSelf || saving || displayRole === "admin"}
							onClick={() => setPendingRole("admin")}
						>
							Admin
						</Button>
					</ButtonGroup>

					<Button
						size="sm"
						disabled={isSelf || saving || !dirty}
						onClick={() => void save()}
					>
						{saving && <Spinner />}
						{saving ? "Saving..." : "Save"}
					</Button>

					<Button
						variant="destructive"
						size="icon"
						aria-label={`Delete ${user.username}`}
						disabled={isSelf || saving}
						onClick={() => setConfirmOpen(true)}
					>
						<Trash2 />
					</Button>
				</div>
			</div>

			{(saved || error) && (
				<div className="px-4 pb-4">
					{saved && <p className="text-xs text-muted-foreground">Saved</p>}
					{error && (
						<p role="alert" className="text-xs text-destructive">
							{error}
						</p>
					)}
				</div>
			)}

			<DeleteUserDialog
				user={user}
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				onDeleted={onDeleted}
			/>
		</Card>
	);
}
