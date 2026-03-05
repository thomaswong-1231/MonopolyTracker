"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PropertyTransferModal } from "@/components/PropertyTransferModal";
import { TransactionModal } from "@/components/TransactionModal";
import {
  COLOR_GROUP_COLORS,
  COLOR_GROUP_ORDER,
  MONOPOLY_PROPERTIES,
  PLAYER_COLOR_OPTIONS,
  PLAYER_TOKEN_CHOICES,
  PLAYER_TOKEN_OPTIONS
} from "@/lib/monopolyData";
import {
  getBuildingUnits,
  getCompleteStreetSetCount,
  getCurrentRentDisplay,
  getHotelPurchaseEligibility,
  getHouseSaleEligibility,
  getHousePurchaseEligibility,
  ownsFullStreetSet
} from "@/lib/propertyRules";
import { calculateNetWorth, calculateUnmortgageValue, money, useGame } from "@/lib/gameStore";
import { TransactionType } from "@/lib/types";

export default function PlayerDetailPage() {
  const params = useParams<{ playerId: string }>();
  const router = useRouter();
  const { session, buyHouse, buyHotel, sellHouse, recordTransaction, transferProperty, mortgageProperty, unmortgageProperty, editPlayer } = useGame();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState<{
    type?: TransactionType;
    fromPlayerId?: string;
    toPlayerId?: string;
    bankPaymentReason?: "tax" | "property";
  }>({});
  const [tradeOpen, setTradeOpen] = useState(false);

  const player = useMemo(
    () => session?.players.find((entry) => entry.id === params.playerId) ?? null,
    [session, params.playerId]
  );

  const ownedProperties = useMemo(() => {
    if (!session || !player) return [];
    return MONOPOLY_PROPERTIES.filter((property) => session.properties[property.id]?.ownerId === player.id);
  }, [session, player]);
  const ownedPropertyGroups = useMemo(() => {
    if (!session || !player) return [];
    const groupOrder = [...COLOR_GROUP_ORDER, "Railroad", "Utility"];
    return groupOrder
      .map((group) => ({
        group,
        properties: ownedProperties.filter((property) => property.colorGroup === group)
      }))
      .filter((entry) => entry.properties.length > 0);
  }, [ownedProperties, player, session]);
  const fullSetCount = useMemo(() => {
    if (!session || !player) return 0;
    return getCompleteStreetSetCount(session, player.id);
  }, [session, player]);
  const avatarFallbackIndex =
    session && player ? Math.max(0, session.players.findIndex((entry) => entry.id === player.id)) : 0;
  const displayAvatar = player
    ? PLAYER_TOKEN_OPTIONS.includes(player.avatar)
      ? player.avatar
      : PLAYER_TOKEN_OPTIONS[avatarFallbackIndex % PLAYER_TOKEN_OPTIONS.length]
    : "🎩";

  if (!session) {
    return (
      <section className="card stack">
        <h1>No active game</h1>
        <button className="button" onClick={() => router.push("/")}>Go Home</button>
      </section>
    );
  }

  if (!player) {
    return (
      <section className="card stack">
        <h1>Player not found</h1>
        <Link className="button" href="/dashboard">Back to Dashboard</Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="card stack player-profile-card player-color-shell">
        <span className="player-color-bar" style={{ backgroundColor: player.color }} aria-hidden />
        <div className="player-profile-top">
          <div className="player-head">
            <span className="player-token" aria-hidden>{displayAvatar}</span>
            <h1>{player.name}</h1>
          </div>
          <div className="player-profile-controls">
            <label className="player-profile-control">
              <span className="tiny muted">Color</span>
              <select
                value={player.color}
                onChange={(event) =>
                  editPlayer(player.id, { name: player.name, color: event.target.value, avatar: player.avatar })
                }
              >
                {PLAYER_COLOR_OPTIONS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="player-profile-control">
              <span className="tiny muted">Token</span>
              <select
                value={PLAYER_TOKEN_OPTIONS.includes(player.avatar) ? player.avatar : PLAYER_TOKEN_OPTIONS[0]}
                onChange={(event) =>
                  editPlayer(player.id, { name: player.name, color: player.color, avatar: event.target.value })
                }
              >
                {PLAYER_TOKEN_CHOICES.map((token) => (
                  <option key={token.value} value={token.value}>
                    {token.value} {token.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <p className={`cash ${player.cash < 0 ? "negative" : ""}`}>Cash: {money(player.cash)}</p>
        <p>Net worth: {money(calculateNetWorth(session, player.id))}</p>
        <p className="muted tiny">Full sets: {fullSetCount}</p>
        {fullSetCount >= 3 && <p className="set-champion">✨ Set Master: {fullSetCount} full sets</p>}
      </div>

      <div className="card stack">
        <h2 className="assets-title">Assets</h2>
        <p className="muted tiny">Properties owned: {ownedProperties.length}</p>
        {ownedProperties.length === 0 ? (
          <p className="muted">No properties owned.</p>
        ) : (
          <div className="assets-groups">
            {ownedPropertyGroups.map((group) => (
              <div key={group.group} className="card stack group-card assets-group-card">
                <div className="property-cards-grid assets-property-list">
                  {group.properties.map((property) => {
            const houseEligibility = getHousePurchaseEligibility(session, property.id);
            const hotelEligibility = getHotelPurchaseEligibility(session, property.id);
            const saleEligibility = getHouseSaleEligibility(session, property.id);
            const propertyState = session.properties[property.id];
            const owner = session.players.find((entry) => entry.id === propertyState?.ownerId);
            const canAffordHouse = (owner?.cash ?? 0) >= (property.rent.houseCost ?? 0);
            const canAffordHotel = (owner?.cash ?? 0) >= (property.rent.houseCost ?? 0);
            const canAffordUnmortgage = (owner?.cash ?? 0) >= calculateUnmortgageValue(property.mortgageValue);
            const hasFullSet =
              property.type === "street" && propertyState?.ownerId
                ? ownsFullStreetSet(session, propertyState.ownerId, property.colorGroup)
                : false;
            const buildingUnits = getBuildingUnits(propertyState?.houses ?? 0, propertyState?.hotel ?? false);
            return (
              <div
                key={property.id}
                className={`property-row property-row-fancy asset-property-card ${hasFullSet ? "asset-property-card-full-set" : ""}`}
              >
                <span
                  className="property-color-bar"
                  style={{ backgroundColor: COLOR_GROUP_COLORS[property.colorGroup] ?? "#9ca3af" }}
                  aria-hidden
                />
                <div className="property-main">
                  <div className="property-main-split asset-property-main-split">
                    <div className="property-details">
                      <div className="property-topline">
                        <Link
                          href={`/properties/${property.id}`}
                          className="property-name-title property-name-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {property.name}
                        </Link>
                      </div>
                    </div>
                    <div className="property-rent-spotlight asset-property-rent-spotlight">
                      {propertyState?.mortgaged ? (
                        <>
                          <p className="property-rent-label">Unmortgage Value</p>
                          <p className="property-rent-value">{money(calculateUnmortgageValue(property.mortgageValue))}</p>
                        </>
                      ) : (
                        <>
                          <div className="asset-rent-meta">
                            <span>Price: {money(property.purchasePrice)}</span>
                            <span>Mortgage Value: {money(property.mortgageValue)}</span>
                            <span>Houses: {buildingUnits}</span>
                          </div>
                          <p className="property-rent-label">Current Rent</p>
                          <p className="property-rent-value">{getCurrentRentDisplay(session, property.id)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="button-row asset-command-row">
                    {property.type === "street" && hasFullSet && !propertyState?.hotel && propertyState?.houses < 4 && (
                      <button
                        className="button button-muted asset-command-button asset-house-button"
                        type="button"
                        onClick={() => {
                          const result = buyHouse(property.id);
                          if (!result.ok && result.reason?.includes("exceed lowest by more than 1 house")) {
                            window.alert(result.reason);
                          }
                        }}
                        disabled={!houseEligibility.canBuy || !canAffordHouse}
                        title={houseEligibility.reason ?? (!canAffordHouse ? "Not enough cash" : undefined)}
                      >
                        Buy House ({money(property.rent.houseCost ?? 0)})
                      </button>
                    )}
                    {property.type === "street" && hasFullSet && !propertyState?.hotel && propertyState?.houses === 4 && (
                      <button
                        className="button button-muted asset-command-button asset-house-button"
                        type="button"
                        onClick={() => {
                          const result = buyHotel(property.id);
                          if (!result.ok && result.reason?.includes("exceed lowest by more than 1 house")) {
                            window.alert(result.reason);
                          }
                        }}
                        disabled={!hotelEligibility.canBuy || !canAffordHotel}
                        title={hotelEligibility.reason ?? (!canAffordHotel ? "Not enough cash" : undefined)}
                      >
                        Buy Hotel ({money(property.rent.houseCost ?? 0)})
                      </button>
                    )}
                    {property.type === "street" && hasFullSet && propertyState?.hotel && (
                      <button className="button button-muted asset-command-button" type="button" disabled>
                        Hotel Bought
                      </button>
                    )}
                    {property.type === "street" && (propertyState?.houses > 0 || propertyState?.hotel) && (
                      <button
                        className="button button-muted asset-command-button asset-house-button"
                        type="button"
                        onClick={() => {
                          const result = sellHouse(property.id);
                          if (!result.ok && result.reason?.includes("exceed 1 house")) {
                            window.alert(result.reason);
                          }
                        }}
                        disabled={!saleEligibility.canSell}
                        title={saleEligibility.reason}
                      >
                        Sell House ({money(Math.floor((property.rent.houseCost ?? 0) / 2))})
                      </button>
                    )}
                    {propertyState?.mortgaged ? (
                      <button
                        className="button asset-command-button"
                        type="button"
                        onClick={() => {
                          unmortgageProperty(property.id);
                        }}
                        disabled={!canAffordUnmortgage}
                        title={!canAffordUnmortgage ? "Not enough cash to unmortgage" : undefined}
                      >
                        Unmortgage
                      </button>
                    ) : buildingUnits === 0 ? (
                      <button
                        className="button asset-command-button"
                        type="button"
                        onClick={() => {
                          mortgageProperty(property.id);
                        }}
                      >
                        Mortgage
                      </button>
                    ) : null}
                  </div>
                  {!hasFullSet && property.type === "street" && (
                    <p className="muted own-set-hint">Own full {property.colorGroup} set to build houses.</p>
                  )}
                </div>
              </div>
            );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card stack commands-card">
        <h2>Commands</h2>
        <p className="muted tiny commands-subtitle">Run actions for {player.name}, including property trade.</p>
        <div className="button-row">
          <button
            className="button button-muted"
            onClick={() => {
              setPaymentPreset({ type: "player_to_bank", fromPlayerId: player.id, bankPaymentReason: "property" });
              setPaymentOpen(true);
            }}
          >
            Buy Property
          </button>
          <button
            className="button button-muted"
            onClick={() => {
              setPaymentPreset({ type: "player_to_bank", fromPlayerId: player.id, bankPaymentReason: "tax" });
              setPaymentOpen(true);
            }}
          >
            Pay Bank
          </button>
          <button
            className="button button-muted"
            onClick={() => {
              setPaymentPreset({ type: "bank_to_player", toPlayerId: player.id });
              setPaymentOpen(true);
            }}
          >
            Get Money from Bank
          </button>
          <button
            className="button button-muted"
            onClick={() => {
              setPaymentPreset({ type: "player_to_player", fromPlayerId: player.id });
              setPaymentOpen(true);
            }}
          >
            Pay Rent
          </button>
          <button className="button button-muted" onClick={() => setTradeOpen(true)}>
            Trade Property
          </button>
        </div>
      </div>

      <TransactionModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
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
        initial={paymentPreset}
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
        initialFromPlayerId={player.id}
        onSave={transferProperty}
      />
    </section>
  );
}
