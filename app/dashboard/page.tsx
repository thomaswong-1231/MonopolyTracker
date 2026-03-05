"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyTransferModal } from "@/components/PropertyTransferModal";
import { TransactionModal } from "@/components/TransactionModal";
import { MONOPOLY_PROPERTIES } from "@/lib/monopolyData";
import { getCurrentRentDisplay } from "@/lib/propertyRules";
import { calculateNetWorth, money, useGame } from "@/lib/gameStore";
import { TransactionType } from "@/lib/types";

export default function DashboardPage() {
  const playerTokenOptions = ["🎩", "🐶", "🐱", "🚢", "🚗", "👢", "🦆", "🐧", "🛞", "🧺"];
  const router = useRouter();
  const { session, recordTransaction, transferProperty } = useGame();

  const [open, setOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [preset, setPreset] = useState<{
    type?: TransactionType;
    fromPlayerId?: string;
    toPlayerId?: string;
    bankPaymentReason?: "tax" | "property";
  }>({});

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
        <h1>Players</h1>
        <div className="button-row">
          <button className="button" onClick={() => setTradeOpen(true)}>
            Trade Time
          </button>
        </div>
      </div>

      <div className="grid dashboard-player-list">
        {session.players.map((player, index) => {
          const displayAvatar = playerTokenOptions.includes(player.avatar)
            ? player.avatar
            : playerTokenOptions[index % playerTokenOptions.length];
          const netWorth = calculateNetWorth(session, player.id);
          const ownedProperties = MONOPOLY_PROPERTIES.filter(
            (property) => session.properties[property.id]?.ownerId === player.id
          );
          return (
            <article
              className="card player-card player-color-shell clickable-card"
              key={player.id}
              onClick={() => router.push(`/players/${player.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/players/${player.id}`);
                }
              }}
            >
              <span className="player-color-bar" style={{ backgroundColor: player.color }} aria-hidden />
              <div className="player-summary-row">
                <div className="player-summary-left">
                  <p className="player-index-label">Player {index + 1}:</p>
                  <div className="player-head">
                    <span className="player-token" aria-hidden>{displayAvatar}</span>
                    <strong>{player.name}</strong>
                  </div>
                  <p className="muted tiny player-properties-inline">
                    Properties: {ownedProperties.length === 0 ? "None" : ownedProperties.map((property) => property.name).join(", ")}
                  </p>
                </div>
                <div className="player-money-box">
                  <p className={`cash dashboard-cash ${player.cash < 0 ? "negative" : ""}`}>Cash: {money(player.cash)}</p>
                  <p className="player-net-worth">Net worth: {money(netWorth)}</p>
                </div>
              </div>
              <div className="button-row">
                <button className="button button-muted" onClick={(event) => { event.stopPropagation(); setPreset({ type: "player_to_bank", fromPlayerId: player.id, bankPaymentReason: "property" }); setOpen(true); }}>Buy Property</button>
                <button className="button button-muted" onClick={(event) => { event.stopPropagation(); setPreset({ type: "player_to_bank", fromPlayerId: player.id, bankPaymentReason: "tax" }); setOpen(true); }}>Pay Bank</button>
                <button className="button button-muted" onClick={(event) => { event.stopPropagation(); setPreset({ type: "bank_to_player", toPlayerId: player.id }); setOpen(true); }}>Get Money from Bank</button>
                <button className="button button-muted" onClick={(event) => { event.stopPropagation(); setPreset({ type: "player_to_player", fromPlayerId: player.id }); setOpen(true); }}>Pay Rent</button>
              </div>
            </article>
          );
        })}
      </div>

      <TransactionModal
        open={open}
        onClose={() => setOpen(false)}
        players={session.players}
        properties={MONOPOLY_PROPERTIES.map((property) => ({
          id: property.id,
          name: property.name,
          type: property.type,
          purchasePrice: property.purchasePrice,
          mortgageValue: property.mortgageValue,
          colorGroup: property.colorGroup,
          ownerId: session.properties[property.id]?.ownerId ?? null,
          houses: session.properties[property.id]?.houses ?? 0,
          hotel: session.properties[property.id]?.hotel ?? false,
          mortgaged: session.properties[property.id]?.mortgaged ?? false,
          currentRentDisplay: getCurrentRentDisplay(session, property.id)
        }))}
        onSave={recordTransaction}
        initial={preset}
      />

      <PropertyTransferModal
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        players={session.players}
        properties={MONOPOLY_PROPERTIES.map((property) => ({
          id: property.id,
          name: property.name,
          colorGroup: property.colorGroup,
          ownerId: session.properties[property.id]?.ownerId ?? null,
          currentRentDisplay: getCurrentRentDisplay(session, property.id)
        }))}
        onSave={transferProperty}
      />
    </section>
  );
}
