"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAYER_COLOR_OPTIONS } from "@/lib/monopolyData";
import { useGame } from "@/lib/gameStore";

export default function SetupPage() {
  const router = useRouter();
  const { session, addPlayer, editPlayer, removePlayer, setStarted, updateGameDetails } = useGame();

  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState(PLAYER_COLOR_OPTIONS[0].value);
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");

  const [gameName, setGameName] = useState(session?.name ?? "");
  const [startingCash, setStartingCash] = useState(session ? String(session.startingCash) : "1500");

  const duplicateNames = useMemo(() => {
    const counter = new Map<string, number>();
    session?.players.forEach((player) => {
      const key = player.name.trim().toLowerCase();
      counter.set(key, (counter.get(key) ?? 0) + 1);
    });
    return counter;
  }, [session?.players]);

  if (!session) {
    return (
      <section className="card stack">
        <h1>No active game</h1>
        <button className="button" onClick={() => router.push("/")}>Go Home</button>
      </section>
    );
  }

  const saveGameSettings = (event: FormEvent) => {
    event.preventDefault();
    const parsedCash = Number(startingCash);
    if (!gameName.trim()) {
      setError("Game name is required.");
      return;
    }
    if (!Number.isInteger(parsedCash)) {
      setError("Starting cash must be a whole number.");
      return;
    }
    updateGameDetails(gameName.trim(), parsedCash);
    setError("");
  };

  const onAddPlayer = (event: FormEvent) => {
    event.preventDefault();
    if (!playerName.trim()) {
      setError("Player name is required.");
      return;
    }
    if (!playerColor) {
      setError("Player color is required.");
      return;
    }
    const result = addPlayer(playerName, playerColor, avatar);
    if (!result.ok) {
      setError(result.reason ?? "Unable to add player.");
      return;
    }
    setPlayerName("");
    setAvatar("");
    setError("");
  };

  const onStartGame = () => {
    if (session.players.length < 2) {
      setError("Add at least 2 players.");
      return;
    }
    setStarted(true);
    router.push("/dashboard");
  };

  return (
    <section className="stack">
      <h1>Setup</h1>

      <form className="card form-stack" onSubmit={saveGameSettings}>
        <h2>Game Settings</h2>
        <label>
          Game Name
          <input value={gameName} onChange={(event) => setGameName(event.target.value)} required />
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
        <button className="button" type="submit">Save Settings</button>
      </form>

      <form className="card form-stack" onSubmit={onAddPlayer}>
        <h2>Add Player ({session.players.length}/10)</h2>
        <label>
          Name
          <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} required />
        </label>
        <label>
          Color
          <select value={playerColor} onChange={(event) => setPlayerColor(event.target.value)}>
            {PLAYER_COLOR_OPTIONS.map((color) => (
              <option key={color.value} value={color.value}>{color.name}</option>
            ))}
          </select>
        </label>
        <p className="inline-color">
          <span className="color-dot" style={{ backgroundColor: playerColor }} aria-hidden />
          {PLAYER_COLOR_OPTIONS.find((color) => color.value === playerColor)?.name ?? "Custom"}
        </p>
        <label>
          Avatar / Initial (optional)
          <input value={avatar} maxLength={2} onChange={(event) => setAvatar(event.target.value)} />
        </label>
        <button className="button" type="submit" disabled={session.players.length >= 10}>Add Player</button>
      </form>

      <div className="card stack">
        <h2>Players</h2>
        {session.players.length === 0 && <p className="muted">No players yet.</p>}
        {session.players.map((player) => {
          const key = player.name.trim().toLowerCase();
          const isDuplicate = (duplicateNames.get(key) ?? 0) > 1;
          return (
            <article key={player.id} className="player-row">
              <span className="color-dot" style={{ backgroundColor: player.color }} aria-hidden />
              <div className="player-row-main">
                <input
                  aria-label={`Name for ${player.name}`}
                  defaultValue={player.name}
                  onBlur={(event) => {
                    const nextName = event.target.value.trim();
                    if (nextName && nextName !== player.name) {
                      editPlayer(player.id, { name: nextName, color: player.color, avatar: player.avatar });
                    }
                  }}
                />
                <label className="sr-only" htmlFor={`color-${player.id}`}>Player color</label>
                <select
                  id={`color-${player.id}`}
                  value={player.color}
                  onChange={(event) => editPlayer(player.id, { name: player.name, color: event.target.value, avatar: player.avatar })}
                >
                  {PLAYER_COLOR_OPTIONS.map((color) => (
                    <option key={color.value} value={color.value}>{color.name}</option>
                  ))}
                </select>
                {isDuplicate && <span className="muted tiny">Duplicate name</span>}
              </div>
              <button
                className="button button-danger"
                onClick={() => {
                  if (window.confirm(`Remove ${player.name}?`)) removePlayer(player.id);
                }}
                type="button"
              >
                Remove
              </button>
            </article>
          );
        })}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="button" onClick={onStartGame} disabled={session.players.length < 2}>Start Game</button>
    </section>
  );
}
