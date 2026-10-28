"use client";

import { useParams } from "next/navigation";
import { CompanyDetailPage } from "@/components/companies/company-detail-page";

export default function DeveloperDetailPage() {
	const params = useParams<{ developer_id: string }>();
	return <CompanyDetailPage kind="developer" companyId={params.developer_id} />;
}
