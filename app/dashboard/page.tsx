"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyTransferModal } from "@/components/PropertyTransferModal";
import { TransactionModal } from "@/components/TransactionModal";
import { COLOR_GROUP_COLORS, MONOPOLY_PROPERTIES, PLAYER_TOKEN_OPTIONS } from "@/lib/monopolyData";
import { getCurrentRentDisplay } from "@/lib/propertyRules";
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
          const displayAvatar = PLAYER_TOKEN_OPTIONS.includes(player.avatar)
            ? player.avatar
            : PLAYER_TOKEN_OPTIONS[index % PLAYER_TOKEN_OPTIONS.length];
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
              <div className="player-card-content">
                <div className="player-card-header" style={{ backgroundColor: player.color }}>
                  <div className="player-card-header-main">
                    <p className="player-card-label">Player {index + 1}:</p>
                    <p className="player-card-name">{player.name}</p>
                  </div>
                </div>
                <div className="player-card-body">
                  <div className="player-token-box" aria-hidden>
                    <span className="player-token player-token-large">{displayAvatar}</span>
                  </div>
                  <div className="player-summary-row">
                    <div className="player-summary-left">
                      <p className="player-section-title">Properties</p>
                      {ownedProperties.length === 0 ? (
                        <p className="muted tiny player-properties-inline">None</p>
                      ) : (
                        <div className="player-properties-block">
                          <ul className="player-properties-list">
                            {ownedProperties.map((property) => (
                              <li key={property.id}>
                                <span
                                  className="property-color-dot"
                                  style={{ backgroundColor: COLOR_GROUP_COLORS[property.colorGroup] ?? "#9ca3af" }}
                                  aria-hidden
                                />
                                <span>{property.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                </div>
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
