import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { getBillingAccessState } from "@/lib/billing/service";
import { isMockModeEnabled } from "@/lib/security/runtime";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMock = isMockModeEnabled;
  let userName = "Mock User";

  if (!isMock) {
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

    userName = session.user.name || session.user.email || "";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNav userName={userName} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
