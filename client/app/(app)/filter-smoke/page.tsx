"use client";

import { useState } from "react";
import { ChartFilterPanel } from "@/app/(app)/chart/_components/chart-filter-panel";
import {
  ChartFilters,
  DEFAULT_CHART_FILTERS,
  countActiveChartFilters,
} from "@/components/charts/chart-types";

export default function FilterSmokePage() {
  const [filters, setFilters] = useState<ChartFilters>({
    ...DEFAULT_CHART_FILTERS,
    releaseDate: { min: "2020-01-01", max: "2024-12-31" },
  });

  return (
    <ChartFilterPanel
      filters={filters}
      tagOptions={[{ id: 1, name: "Action" }]}
      languageOptions={[{ id: 0, name: "English" }]}
      activeFilterCount={countActiveChartFilters(filters)}
      onFilterChange={(key, value) =>
        setFilters((current) => ({ ...current, [key]: value }))
      }
      onReset={() => setFilters(DEFAULT_CHART_FILTERS)}
    />
  );
}
