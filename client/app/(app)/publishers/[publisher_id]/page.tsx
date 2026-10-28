"use client";

import { useParams } from "next/navigation";
import { CompanyDetailPage } from "@/components/companies/company-detail-page";

export default function PublisherDetailPage() {
	const params = useParams<{ publisher_id: string }>();
	return <CompanyDetailPage kind="publisher" companyId={params.publisher_id} />;
}
