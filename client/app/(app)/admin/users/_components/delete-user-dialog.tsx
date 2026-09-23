"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, readErrorMessage } from "@/lib/api";
import type { UserListItem } from "../users-types";

interface Props {
	user: UserListItem;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
}

export function DeleteUserDialog({
	user,
	open,
	onOpenChange,
	onDeleted,
}: Props) {
	const [deleting, setDeleting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// Cleared on the way out rather than on the way in, so a reopened dialog is
	// never still showing the last attempt's failure
	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setError(null);
		}

		onOpenChange(next);
	};

	const confirm = async () => {
		setError(null);
		setDeleting(true);

		try {
			// No body, so apiFetch directly rather than one of the JSON helpers
			const response = await apiFetch(`/users/${user.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				// The dialog stays open so a 403 or 409 is readable in context
				setError(await readErrorMessage(response, "Failed to delete user"));
				return;
			}

			handleOpenChange(false);
			onDeleted();
		} catch {
			setError("Failed to delete user");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete {user.username}?</DialogTitle>
					<DialogDescription>
						This permanently removes the account and signs out all of its
						sessions. This cannot be undone.
					</DialogDescription>
				</DialogHeader>

				{error && (
					<p role="alert" className="text-xs text-destructive">
						{error}
					</p>
				)}

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={deleting}>
							Cancel
						</Button>
					</DialogClose>
					<Button
						variant="destructive"
						disabled={deleting}
						onClick={() => void confirm()}
					>
						{deleting && <Spinner />}
						{deleting ? "Deleting..." : "Delete user"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
