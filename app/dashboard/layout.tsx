import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMock = process.env.MOCK_DATA === "true";
  let userName = "Mock User";

  if (!isMock) {
    const session = await auth();
    if (!session?.user) {
      redirect("/login");
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
