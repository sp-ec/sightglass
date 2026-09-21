"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessTab } from "./_components/access-tab";
import { ApiTab } from "./_components/api-tab";
import { EstimationTab } from "./_components/estimation-tab";
import { useAppSettings } from "./_hooks/use-app-settings";

export default function AppSettingsPage() {
	const { appSettings, tagOptions, loading, error, applySaved } =
		useAppSettings();

	if (error) {
		return (
			<p role="alert" className="text-sm text-destructive">
				{error}
			</p>
		);
	}

	if (loading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<Tabs defaultValue="access" className="w-full">
			<TabsList>
				<TabsTrigger value="access">Access</TabsTrigger>
				<TabsTrigger value="api">API</TabsTrigger>
				<TabsTrigger value="estimation">Estimation</TabsTrigger>
			</TabsList>

			<TabsContent value="access" className="mt-6">
				<AccessTab initial={appSettings?.access ?? null} onSaved={applySaved} />
			</TabsContent>

			<TabsContent value="api" className="mt-6">
				<ApiTab current={appSettings?.api ?? null} onSaved={applySaved} />
			</TabsContent>

			<TabsContent value="estimation" className="mt-6">
				<EstimationTab
					initial={appSettings?.estimation ?? null}
					tagOptions={tagOptions}
					onSaved={applySaved}
				/>
			</TabsContent>
		</Tabs>
	);
}
