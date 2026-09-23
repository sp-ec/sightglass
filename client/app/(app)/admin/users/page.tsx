"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/auth-provider";
import { UserRow } from "./_components/user-row";
import { UsersPagination } from "./_components/users-pagination";
import { useUsersList } from "./_hooks/use-users-list";

export default function UsersPage() {
	const { data, loading, error, page, setPage, reload } = useUsersList();
	const { user: currentUser } = useAuth();

	const changePage = (next: number) => {
		setPage(next);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Deleting the only row on a page would leave the admin looking at an empty
	// list past the new end of it, so step back instead. setPage refetches.
	const handleDeleted = () => {
		if (data && data.users.length === 1 && page > 1) {
			setPage(page - 1);
			return;
		}

		reload();
	};

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			{/* Only the first load shows skeletons; a refetch after a save keeps the
			    old rows on screen rather than collapsing the list */}
			{loading && !data ? (
				<div className="flex flex-col gap-3">
					{Array.from({ length: 10 }).map((_, i) => (
						<Skeleton key={i} className="h-24 w-full" />
					))}
				</div>
			) : (
				<div
					className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}
					aria-busy={loading}
				>
					{data?.users.map((user) => (
						<UserRow
							key={user.id}
							user={user}
							isSelf={user.id === currentUser?.id}
							onChanged={reload}
							onDeleted={handleDeleted}
						/>
					))}
				</div>
			)}

			{data && data.users.length > 0 && (
				<UsersPagination
					page={data.page}
					totalPages={data.total_pages}
					total={data.total}
					disabled={loading}
					onPageChange={changePage}
				/>
			)}
		</div>
	);
}
