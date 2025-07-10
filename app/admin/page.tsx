import { DataTable } from "@/components/sidebar/data-table";
import { requireAdmin } from "@/app/data/admin/require-admin";
import { SectionCards } from "@/components/sidebar/section-cards";
import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";

import data from "./data.json";

export default async function AdminIndexPage() {
  await requireAdmin();

  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
