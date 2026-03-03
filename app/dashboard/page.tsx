"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyTransferModal } from "@/components/PropertyTransferModal";
import { TransactionModal } from "@/components/TransactionModal";
import { MONOPOLY_PROPERTIES } from "@/lib/monopolyData";
import { calculateNetWorth, money, useGame } from "@/lib/gameStore";
import { TransactionType } from "@/lib/types";

export default function DashboardPage() {
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

  const playersByWorth = useMemo(() => {
    if (!session) return [];
    return [...session.players].sort(
      (first, second) => calculateNetWorth(session, second.id) - calculateNetWorth(session, first.id)
    );
  }, [session]);

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
        {playersByWorth.map((player, index) => {
          const netWorth = calculateNetWorth(session, player.id);
          const ownedProperties = MONOPOLY_PROPERTIES.filter(
            (property) => session.properties[property.id]?.ownerId === player.id
          );
          return (
            <article
              className="card player-card clickable-card"
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
              <div className="player-summary-row">
                <div className="player-summary-left">
                  <p className="player-index-label">Player {index + 1}:</p>
                  <div className="player-head">
                    <span className="color-dot" style={{ backgroundColor: player.color }} aria-hidden />
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
          purchasePrice: property.purchasePrice,
          colorGroup: property.colorGroup,
          ownerId: session.properties[property.id]?.ownerId ?? null
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
          ownerId: session.properties[property.id]?.ownerId ?? null
        }))}
        onSave={transferProperty}
      />
    </section>
  );
}
