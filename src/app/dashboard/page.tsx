"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  created_at: string;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setLeads(data || []);
    setLoading(false);
  }

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    const { error } = await supabase.from("leads").insert([
      {
        user_id: user?.id,
        name: form.name,
        email: form.email,
        company: form.company,
      },
    ]);
    if (!error) {
      setForm({ name: "", email: "", company: "" });
      fetchLeads();
    } else console.error(error);
  }

  async function deleteLead(id: string) {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) setLeads(leads.filter((l) => l.id !== id));
    else console.error(error);
  }

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user?.firstName} 👋</h1>

      <form onSubmit={addLead} className="flex gap-2 flex-wrap justify-center">
        <input
          className="border rounded p-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="border rounded p-2"
          placeholder="Company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </form>

      <input
        type="text"
        placeholder="Search leads..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded p-2 w-full max-w-md"
      />

      {loading ? (
        <p>Loading leads...</p>
      ) : filteredLeads.length === 0 ? (
        <p>No leads found.</p>
      ) : (
        <table className="border-collapse border border-gray-300 w-full max-w-3xl text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Company</th>
              <th className="border p-2">Added</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id}>
                <td className="border p-2">{lead.name}</td>
                <td className="border p-2">{lead.email}</td>
                <td className="border p-2">{lead.company}</td>
                <td className="border p-2 text-gray-500 text-sm">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => deleteLead(lead.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
