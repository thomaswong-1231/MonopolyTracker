"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PLAYER_COLOR_OPTIONS } from "@/lib/monopolyData";
import { useGame } from "@/lib/gameStore";

export default function SettingsPage() {
  const router = useRouter();
  const { session, updateGameDetails, addPlayer, resetGame } = useGame();

  const [name, setName] = useState(session?.name ?? "");
  const [startingCash, setStartingCash] = useState(session ? String(session.startingCash) : "1500");
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState(PLAYER_COLOR_OPTIONS[0].value);
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");

  if (!session) {
    return (
      <section className="card stack">
        <h1>No active game</h1>
        <button className="button" onClick={() => router.push("/")}>Go Home</button>
      </section>
    );
  }

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    const parsedCash = Number(startingCash);
    if (!name.trim()) {
      setError("Game name is required.");
      return;
    }
    if (!Number.isInteger(parsedCash)) {
      setError("Starting cash must be a whole number.");
      return;
    }
    updateGameDetails(name.trim(), parsedCash);
    setError("");
  };

  const onAddPlayer = (event: FormEvent) => {
    event.preventDefault();
    if (!playerName.trim()) {
      setError("Player name is required.");
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

  return (
    <section className="stack">
      <h1>Settings</h1>
      <form className="card form-stack" onSubmit={onSave}>
        <label>
          Game Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Starting Cash (new players only)
          <input
            value={startingCash}
            onChange={(event) => setStartingCash(event.target.value.replace(/[^0-9-]/g, ""))}
            inputMode="numeric"
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="button" type="submit">Save</button>
      </form>

      <form className="card form-stack" onSubmit={onAddPlayer}>
        <h2>Add Player Mid-Game ({session.players.length}/10)</h2>
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
        <h2>Danger Zone</h2>
        <button
          className="button button-danger"
          onClick={() => {
            if (window.confirm("Delete this game? This cannot be undone.")) {
              resetGame();
              router.push("/");
            }
          }}
        >
          Delete Current Game
        </button>
      </div>
    </section>
  );
}
