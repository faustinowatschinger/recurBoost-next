import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNav userName={session.user.name || session.user.email || ""} />
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
