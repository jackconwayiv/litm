import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ProfileRow = { id: string; display_name: string };

export default function Profile() {
  const [me, setMe] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setOk(null);

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) {
      setErr("Not authenticated.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name")
      .eq("id", uid)
      .single();

    if (error) setErr(error.message);
    else {
      setMe(data as ProfileRow);
      setName((data as ProfileRow).display_name ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setErr(null);
    setOk(null);
    if (!me) return;

    const display_name = name.trim();
    if (!display_name) return setErr("Name required.");

    const { error } = await supabase
      .from("profiles")
      .update({ display_name })
      .eq("id", me.id);

    if (error) setErr(error.message);
    else setOk("Saved.");
  }

  return (
    <main style={{ padding: 16 }}>
      <h2>Profile</h2>
      {loading ? (
        <p>Loading…</p>
      ) : err ? (
        <p style={{ color: "crimson" }}>Error: {err}</p>
      ) : me ? (
        <>
          <p>
            <strong>Current Name:</strong> {me.display_name}
          </p>
          <label style={{ display: "block", margin: "12px 0 4px" }}>
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={save}>Save</button>
            <button onClick={load} style={{ marginLeft: 8 }}>
              Reload
            </button>
          </div>
          {ok && <p style={{ color: "seagreen", marginTop: 8 }}>{ok}</p>}
        </>
      ) : (
        <p>No profile found.</p>
      )}
    </main>
  );
}
