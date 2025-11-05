import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Welcome, {user?.firstName || "friend"} 👋
      </h1>
      <p>This will be your leads dashboard soon.</p>
    </main>
  );
}
