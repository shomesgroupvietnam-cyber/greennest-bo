import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AxisOnePage() {
  redirect("/command-center?view=axis1-search-development");
}
