import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { getBillingAccessState } from "@/lib/billing/service";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const billing = await getBillingAccessState(session.user.id, {
    autoExpireTrial: true,
  });
  if (!billing.canAccessProduct) {
    redirect("/billing");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNav userName={session.user.name || session.user.email || ""} />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
