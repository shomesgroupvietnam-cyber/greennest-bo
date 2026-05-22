import { redirect } from "next/navigation";

export default async function DashboardPage() {
  redirect("/command-center?view=operations-dashboard");
}
