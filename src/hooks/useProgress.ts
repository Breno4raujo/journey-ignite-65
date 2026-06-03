import { useEffect, useState } from "react";
import type { PaceMode, ProgressSummary } from "@/lib/aprenderja/types";

export function useProgress(userId: string | null, pace: PaceMode) {
  const [summaries, setSummaries] = useState<ProgressSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);

    fetch(`/api/progress/${userId}?pace=${pace}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar progresso");
        return r.json();
      })
      .then((data) => {
        setSummaries(data.summaries ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    return () => setSummaries([]);
  }, [userId, pace]);

  return { summaries, loading, error };
}