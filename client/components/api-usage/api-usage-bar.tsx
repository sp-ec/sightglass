import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { apiUsage } from "./api-usage-types";

interface Props {
	usage: apiUsage | null;
}

const WARNING_RATIO = 0.9;
const format = Intl.NumberFormat("en-US").format;

export function ApiUsageBar({ usage }: Props) {
	const used = usage?.used ?? 0;
	const limit = usage?.limit ?? 1;
	const ratio = Math.min(used / limit, 1);

	return (
		<Field className="w-full">
			<FieldLabel htmlFor="api-usage">
				<span className="text-sm text-muted-foreground">
					{usage
						? `${format(used)} of ${format(usage.limit)} API requests used today`
						: "Loading API usage..."}
				</span>
				{usage && (
					<span className="ml-auto text-sm text-muted-foreground">
						{format(Math.max(usage.limit - used, 0))} remaining
					</span>
				)}
			</FieldLabel>
			<Progress
				id="api-usage"
				value={ratio * 100}
				className={cn(
					ratio >= WARNING_RATIO &&
						"[&_[data-slot=progress-indicator]]:from-destructive/70 [&_[data-slot=progress-indicator]]:to-destructive",
				)}
			/>
			{usage && (
				<p className="text-xs text-muted-foreground opacity-50">
					Resets {new Date(usage.resetsAt).toLocaleString()}
				</p>
			)}
		</Field>
	);
}
