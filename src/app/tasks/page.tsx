"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TaskRow = {
  id: string;
  task_date: string;
  start_time: string;
  event: string;
  activity_name: string;
  task_text: string | null;
  owner: string | null;
  done: boolean;
};

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Når vi kommer fra magic link ligger token i URL-hash.
      // Supabase-klienten fanger dette automatisk og setter session.
      await supabase.auth.getSession();
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("upcoming_tasks")
      .select("id, task_date, start_time, event, activity_name, task_text, owner, done")
      .order("task_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as TaskRow[]);
    setLoading(false);
  }

  async function markDone(id: string) {
    setError(null);

    const { error } = await supabase.from("tasks").update({ done: true }).eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    // Siden viewet viser done=false, fjerner vi raden lokalt.
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Kommende oppgaver</h1>
        <button
          onClick={load}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ccc" }}
        >
          Oppdater
        </button>
        <button
          onClick={logout}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        >
          Logg ut
        </button>
      </div>

      {error && <p style={{ marginTop: 12 }}>Feil: {error}</p>}
      {loading && <p style={{ marginTop: 12 }}>Laster…</p>}

      {!loading && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Dato", "Tid", "Event", "Aktivitet", "Oppgave", "Ansvar", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #ddd",
                      padding: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>{r.task_date}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>{r.start_time}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>{r.event}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>{r.activity_name}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>{r.task_text ?? ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>{r.owner ?? ""}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}>
                    <button
                      onClick={() => markDone(r.id)}
                      style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc" }}
                    >
                      Done
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 10 }}>
                    Ingen kommende oppgaver 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
