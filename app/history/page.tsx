"use client";

import { useRouter } from "next/navigation";
import { money, useGame } from "@/lib/gameStore";

export default function HistoryPage() {
  const router = useRouter();
  const { session, undoCount, undoLastAction } = useGame();

  if (!session) {
    return (
      <section className="card stack">
        <h1>No active game</h1>
        <button className="button" onClick={() => router.push("/")}>Go Home</button>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="section-title-row">
        <h1>History</h1>
        <button className="button" onClick={undoLastAction} disabled={undoCount === 0}>Undo Last Action</button>
      </div>

      <div className="card stack">
        {session.history.length === 0 ? (
          <p className="muted">No history yet.</p>
        ) : (
          session.history.map((entry) => (
            <article key={entry.id} className="history-row">
              <p><strong>{entry.description}</strong></p>
              <p className="muted tiny">{new Date(entry.timestamp).toLocaleString()}</p>
              <p className="muted tiny">Type: {entry.eventType}</p>
              {(entry.fromPlayerId || entry.toPlayerId) && (
                <p className="muted tiny">
                  {entry.fromPlayerId ? `From: ${session.players.find((player) => player.id === entry.fromPlayerId)?.name ?? "Unknown"}` : ""}
                  {entry.toPlayerId ? ` To: ${session.players.find((player) => player.id === entry.toPlayerId)?.name ?? "Unknown"}` : ""}
                </p>
              )}
              {typeof entry.amount === "number" && <p className="muted tiny">Amount: {money(entry.amount)}</p>}
              {entry.note && <p className="muted tiny">Note: {entry.note}</p>}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
