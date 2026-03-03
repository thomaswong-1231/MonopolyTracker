"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/gameStore";

export default function HomePage() {
  const router = useRouter();
  const { sessions, createGame, setActiveSession, deleteGame } = useGame();

  const [name, setName] = useState("");
  const [startingCash, setStartingCash] = useState("1500");
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const parsedCash = Number(startingCash);

    if (!normalizedName) {
      setError("Game name is required.");
      return;
    }

    if (!Number.isInteger(parsedCash)) {
      setError("Starting cash must be a whole number.");
      return;
    }

    createGame(normalizedName, parsedCash);
    router.push("/setup");
  };

  return (
    <section className="stack home-page">
      <div className="cover-hero cover-hero-image">
        <img
          src="/monopoly-home-graphic.png"
          alt="Monopoly board graphic"
          className="cover-hero-photo"
        />
      </div>

      <h1 className="home-title">Monopoly Game Tracker</h1>
      <p className="muted home-subtitle">Create a game quickly and track cash, properties, and history with undo.</p>

      <form className="card form-stack" onSubmit={onSubmit}>
        <h2>Create Game</h2>
        <label>
          Game Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Starting Cash
          <input
            value={startingCash}
            onChange={(event) => setStartingCash(event.target.value.replace(/[^0-9-]/g, ""))}
            inputMode="numeric"
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="button" type="submit">Create Game</button>
      </form>

      <div className="card stack">
        <h2>Saved Games</h2>
        {sessions.length === 0 && <p className="muted">No saved games yet.</p>}
        {sessions.map((session) => (
          <article key={session.id} className="row-between">
            <button
              className="saved-game-open-title"
              onClick={() => {
                setActiveSession(session.id);
                router.push(session.started ? "/dashboard" : "/setup");
              }}
              type="button"
            >
              <strong>{session.name}</strong>
              <p className="muted tiny">
                Players: {session.players.length} · Starting cash ${session.startingCash}
              </p>
            </button>
            <div className="button-row">
              <button
                className="button button-muted"
                onClick={() => {
                  setActiveSession(session.id);
                  router.push(session.started ? "/dashboard" : "/setup");
                }}
                type="button"
              >
                Open
              </button>
              <button
                className="button button-danger"
                onClick={() => {
                  if (window.confirm(`Delete game "${session.name}"?`)) {
                    deleteGame(session.id);
                  }
                }}
                type="button"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
