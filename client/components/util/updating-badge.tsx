import { Badge } from "@/components/ui/badge";

import { LucideRefreshCcw } from "lucide-react";

export function UpdatingBadge() {
	return (
		<div className="flex flex-wrap gap-2">
			<Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
				<LucideRefreshCcw className={`size-4 animate-spin`} />
				Updating
			</Badge>
		</div>
	);
}
