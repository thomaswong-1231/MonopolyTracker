"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { COLOR_GROUP_COLORS, PLAYER_TOKEN_OPTIONS } from "@/lib/monopolyData";
import { BankPaymentReason, Player, TransactionType } from "@/lib/types";

interface PropertyOption {
  id: string;
  name: string;
  type: "street" | "railroad" | "utility";
  ownerId: string | null;
  purchasePrice: number;
  mortgageValue: number;
  colorGroup: string;
  houses: number;
  hotel: boolean;
  mortgaged: boolean;
  currentRentDisplay: string;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  onSave: (args: {
    type: TransactionType;
    amount: number;
    fromPlayerId?: string;
    toPlayerId?: string;
    bankPaymentReason?: BankPaymentReason;
    propertyId?: string;
    note?: string;
  }) => { ok: boolean; reason?: string };
  properties: PropertyOption[];
  initial?: {
    type?: TransactionType;
    fromPlayerId?: string;
    toPlayerId?: string;
    bankPaymentReason?: BankPaymentReason;
  };
}

export function TransactionModal({ open, onClose, players, properties, onSave, initial }: TransactionModalProps) {
  const colorByGroup: Record<string, string> = COLOR_GROUP_COLORS;

  const [type, setType] = useState<TransactionType>(initial?.type ?? "player_to_bank");
  const [amount, setAmount] = useState("");
  const [fromPlayerId, setFromPlayerId] = useState(initial?.fromPlayerId ?? "");
  const [toPlayerId, setToPlayerId] = useState(initial?.toPlayerId ?? "");
  const [bankPaymentReason, setBankPaymentReason] = useState<BankPaymentReason>(
    initial?.bankPaymentReason ?? "tax"
  );
  const [propertyId, setPropertyId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const selectedProperty = properties.find((property) => property.id === propertyId);
  const availableProperties = properties.filter((property) => property.ownerId === null);
  const rentTargetProperties = useMemo(
    () => properties.filter((property) => property.ownerId === toPlayerId),
    [properties, toPlayerId]
  );
  const ownedPropertiesByPlayer = useMemo(() => {
    const grouped = new Map<string, PropertyOption[]>();
    properties.forEach((property) => {
      if (!property.ownerId) return;
      const existing = grouped.get(property.ownerId) ?? [];
      existing.push(property);
      grouped.set(property.ownerId, existing);
    });
    return grouped;
  }, [properties]);
  const rentTargetPlayers = useMemo(
    () => players.filter((player) => player.id !== fromPlayerId),
    [players, fromPlayerId]
  );
  const availablePropertyGroups = useMemo(() => {
    const colorGroupDisplayOrder = [
      "Brown",
      "Light Blue",
      "Pink",
      "Orange",
      "Red",
      "Yellow",
      "Green",
      "Dark Blue",
      "Railroad",
      "Utility"
    ];
    const unowned = properties.filter((property) => property.ownerId === null);
    return colorGroupDisplayOrder
      .map((group) => ({
        group,
        properties: unowned.filter((property) => property.colorGroup === group)
      }))
      .filter((entry) => entry.properties.length > 0);
  }, [properties]);
  const rentPropertyGroups = useMemo(() => {
    const colorGroupDisplayOrder = [
      "Brown",
      "Light Blue",
      "Pink",
      "Orange",
      "Red",
      "Yellow",
      "Green",
      "Dark Blue",
      "Railroad",
      "Utility"
    ];
    return colorGroupDisplayOrder
      .map((group) => ({
        group,
        properties: properties.filter((property) => property.ownerId === toPlayerId && property.colorGroup === group)
      }))
      .filter((entry) => entry.properties.length > 0);
  }, [properties, toPlayerId]);
  const parsedAmount = amount === "" ? NaN : Number(amount);
  const effectiveAmount = parsedAmount;
  const fromPlayer = players.find((player) => player.id === fromPlayerId);
  const projectedNegative =
    Number.isInteger(effectiveAmount) &&
    effectiveAmount > 0 &&
    (type === "player_to_bank" || type === "player_to_player") &&
    !!fromPlayer &&
    fromPlayer.cash - effectiveAmount < 0;

  const canSubmit = useMemo(() => {
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return false;
    }
    if (note.length > 140) return false;
    if (projectedNegative) return false;
    if (type === "player_to_bank") {
      if (!fromPlayerId) return false;
      if (bankPaymentReason === "property") return !!propertyId;
      return true;
    }
    if (type === "bank_to_player") return !!toPlayerId;
    return !!fromPlayerId && !!toPlayerId && fromPlayerId !== toPlayerId;
  }, [parsedAmount, type, fromPlayerId, toPlayerId, note.length, bankPaymentReason, propertyId, projectedNegative]);

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "player_to_bank");
    setAmount("");
    setFromPlayerId(initial?.fromPlayerId ?? "");
    setToPlayerId(initial?.toPlayerId ?? "");
    setBankPaymentReason(initial?.bankPaymentReason ?? "tax");
    setPropertyId("");
    setNote("");
    setError("");
  }, [open, initial?.type, initial?.fromPlayerId, initial?.toPlayerId, initial?.bankPaymentReason]);

  useEffect(() => {
    if (type !== "player_to_bank" || bankPaymentReason !== "property") return;
    if (!selectedProperty) return;
    setAmount(String(selectedProperty.purchasePrice));
  }, [type, bankPaymentReason, selectedProperty?.id]);

  useEffect(() => {
    if (type !== "player_to_player") return;
    if (!toPlayerId) return;
    if (toPlayerId === fromPlayerId) {
      setToPlayerId("");
      setPropertyId("");
    }
  }, [type, fromPlayerId, toPlayerId]);

  useEffect(() => {
    if (type !== "player_to_player") return;
    if (!selectedProperty || selectedProperty.ownerId !== toPlayerId) {
      setPropertyId("");
      return;
    }
    if (selectedProperty.currentRentDisplay.startsWith("$")) {
      const rentAmount = Number(selectedProperty.currentRentDisplay.replace(/[^0-9]/g, ""));
      if (Number.isInteger(rentAmount) && rentAmount > 0) {
        setAmount(String(rentAmount));
      }
    }
  }, [type, toPlayerId, selectedProperty]);

  if (!open) return null;

  const reset = () => {
    setType(initial?.type ?? "player_to_bank");
    setAmount("");
    setFromPlayerId(initial?.fromPlayerId ?? "");
    setToPlayerId(initial?.toPlayerId ?? "");
    setBankPaymentReason(initial?.bankPaymentReason ?? "tax");
    setPropertyId("");
    setNote("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please complete all required fields with a valid whole-dollar amount.");
      return;
    }

    const result = onSave({
      type,
      amount: Number.isInteger(effectiveAmount) ? effectiveAmount : parsedAmount,
      fromPlayerId: fromPlayerId || undefined,
      toPlayerId: toPlayerId || undefined,
      bankPaymentReason: type === "player_to_bank" ? bankPaymentReason : undefined,
      propertyId:
        type === "player_to_player"
          ? propertyId || undefined
          : type === "player_to_bank" && bankPaymentReason === "property"
            ? propertyId
            : undefined,
      note: note.trim() || undefined
    });

    if (!result.ok) {
      setError(result.reason ?? "Unable to save transaction.");
      return;
    }

    handleClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Record transaction" onClick={(event) => event.stopPropagation()}>
        <h2>Record Cash Transaction</h2>
        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value as TransactionType)}>
              <option value="player_to_bank">Player → Bank</option>
              <option value="bank_to_player">Bank → Player</option>
              <option value="player_to_player">Player → Player</option>
            </select>
          </label>

          {(type === "player_to_bank" || type === "player_to_player") && (
            <label>
              From Player
              <select value={fromPlayerId} onChange={(event) => setFromPlayerId(event.target.value)}>
                <option value="">Select player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(type === "bank_to_player" || type === "player_to_player") && (
            type === "bank_to_player" ? (
              <label>
                To Player
                <select value={toPlayerId} onChange={(event) => setToPlayerId(event.target.value)}>
                  <option value="">Select player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="stack">
                <p className="muted tiny">To Player</p>
                {rentTargetPlayers.length === 0 ? (
                  <p className="muted tiny">No other players available to receive rent.</p>
                ) : (
                  <div className="rent-player-picker">
                    {rentTargetPlayers.map((player, index) => {
                      const isSelected = player.id === toPlayerId;
                      const ownedProperties = ownedPropertiesByPlayer.get(player.id) ?? [];
                      const displayAvatar = PLAYER_TOKEN_OPTIONS.includes(player.avatar)
                        ? player.avatar
                        : PLAYER_TOKEN_OPTIONS[index % PLAYER_TOKEN_OPTIONS.length];
                      return (
                        <button
                          key={player.id}
                          type="button"
                          className={`card player-card rent-player-card-button ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setToPlayerId((current) => (current === player.id ? "" : player.id));
                            setPropertyId("");
                          }}
                          aria-pressed={isSelected}
                          style={{ ["--rent-player-color" as string]: player.color }}
                        >
                          <span className="player-color-bar rent-player-top-bar" style={{ backgroundColor: player.color }} aria-hidden />
                          <div className="player-card-content rent-player-card-content">
                            <div className="player-token-box" aria-hidden>
                              <span className="player-token player-token-large rent-player-token">{displayAvatar}</span>
                            </div>
                            <div className="rent-player-card-summary">
                              <p className="player-index-label">{player.name}</p>
                              <p className="muted tiny player-properties-label">Properties</p>
                            </div>
                            {ownedProperties.length === 0 ? (
                              <p className="muted tiny player-properties-inline">Properties: None</p>
                            ) : (
                              <ul className="player-properties-list rent-player-property-list">
                                {ownedProperties.slice(0, 5).map((property) => (
                                  <li key={property.id}>
                                    <span
                                      className="property-color-dot"
                                      style={{ backgroundColor: colorByGroup[property.colorGroup] ?? "#9ca3af" }}
                                      aria-hidden
                                    />
                                    <span>{property.name}</span>
                                  </li>
                                ))}
                                {ownedProperties.length > 5 && (
                                  <li className="muted tiny">+{ownedProperties.length - 5} more</li>
                                )}
                              </ul>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {type === "player_to_player" && toPlayerId && (
            <div className="stack">
              <p className="muted tiny">Select Rent Property (optional)</p>
              {rentTargetProperties.length === 0 ? (
                <p className="muted tiny">This player has no owned properties.</p>
              ) : (
                <div className="rent-property-picker">
                  {rentPropertyGroups.map((group) => (
                    <div key={group.group} className="rent-property-group">
                      {group.properties.map((property) => {
                        const selected = propertyId === property.id;
                        const propertyColor = colorByGroup[property.colorGroup] ?? "#94a3b8";
                        return (
                          <button
                            key={property.id}
                            type="button"
                            className={`property-row property-row-fancy rent-property-card-button ${selected ? "selected" : ""}`}
                            onClick={() => setPropertyId((current) => (current === property.id ? "" : property.id))}
                            aria-pressed={selected}
                            style={{
                              ["--rent-property-color" as string]: propertyColor,
                              ["--rent-property-price-color-light" as string]:
                                property.colorGroup === "Railroad" ? "#111827" : propertyColor,
                              ["--rent-property-price-color-dark" as string]:
                                property.colorGroup === "Railroad" ? "#93c5fd" : propertyColor,
                              ["--rent-property-banner-color" as string]: propertyColor,
                              ["--rent-property-banner-color-dark" as string]:
                                property.colorGroup === "Railroad" ? "#475569" : propertyColor
                            }}
                          >
                            <span className="sr-only">{selected ? "Selected" : "Select"} {property.name}</span>
                            <span className="property-color-bar rent-property-color-bar" aria-hidden />
                            <div className="property-main buy-property-card-main">
                              <div className="buy-property-card-top">
                                <strong className="buy-property-name">{property.name}</strong>
                              </div>
                              <div className="property-rent-spotlight buy-property-price-box rent-property-price-box">
                                <p className="property-rent-label">Current Rent</p>
                                <p className="property-rent-value">{property.currentRentDisplay}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === "player_to_bank" && (
            <label>
              Payment For
              <select
                value={bankPaymentReason}
                onChange={(event) => {
                  const nextReason = event.target.value as BankPaymentReason;
                  setBankPaymentReason(nextReason);
                  if (nextReason !== "property") {
                    setPropertyId("");
                  }
                }}
              >
                <option value="tax">Tax</option>
                <option value="property">Property</option>
              </select>
            </label>
          )}

          {type === "player_to_bank" && bankPaymentReason === "property" && (
            <div className="stack">
              <p className="muted tiny">Available Properties</p>
              {availableProperties.length === 0 ? (
                <p className="muted tiny">No unowned properties available.</p>
              ) : (
                <div className="buy-property-picker">
                  {availablePropertyGroups.map((group) => (
                    <div key={group.group} className="buy-property-group">
                      {group.properties.map((property) => (
                        <button
                          key={property.id}
                          type="button"
                          className={`property-row property-row-fancy buy-property-card-button ${propertyId === property.id ? "selected" : ""}`}
                          onClick={() => setPropertyId((current) => (current === property.id ? "" : property.id))}
                          aria-pressed={propertyId === property.id}
                          style={{
                            ["--buy-property-color" as string]: colorByGroup[property.colorGroup] ?? "#94a3b8",
                            ["--buy-property-price-color-light" as string]:
                              property.colorGroup === "Railroad" ? "#111827" : colorByGroup[property.colorGroup] ?? "#2563eb",
                            ["--buy-property-price-color-dark" as string]:
                              property.colorGroup === "Railroad" ? "#93c5fd" : colorByGroup[property.colorGroup] ?? "#60a5fa"
                          }}
                        >
                          <span className="sr-only">{propertyId === property.id ? "Selected" : "Select"} {property.name}</span>
                          <span
                            className="property-color-bar"
                            style={{ backgroundColor: colorByGroup[property.colorGroup] ?? "#94a3b8" }}
                            aria-hidden
                          />
                          <div className="property-main buy-property-card-main">
                            <div className="buy-property-card-top">
                              <strong className="buy-property-name">{property.name}</strong>
                            </div>
                            <div className="property-meta buy-property-meta">
                              <span className="muted tiny">Current rent: {property.currentRentDisplay}</span>
                            </div>
                            <div className="property-rent-spotlight buy-property-price-box">
                              <p className="property-rent-label">Buy Price</p>
                              <p className="property-rent-value">${property.purchasePrice}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <label>
            Amount
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              step={1}
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder={
                type === "player_to_bank" && bankPaymentReason === "property"
                  ? "Change to auction amount if applicable"
                  : type === "player_to_player"
                    ? "Auto-filled from selected property rent"
                  : "Whole dollars"
              }
              required
            />
          </label>

          {type === "bank_to_player" && (
            <div className="button-row">
              <button
                type="button"
                className="button button-muted"
                onClick={() => {
                  setAmount("200");
                  if (!note.trim()) {
                    setNote("Collect GO money");
                  }
                }}
              >
                Collect GO Money (+$200)
              </button>
            </div>
          )}

          <label>
            Note (optional)
            <textarea
              value={note}
              maxLength={140}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Add context"
            />
          </label>

          {projectedNegative && (
            <p className="warning-text">Insufficient cash: this transaction would make the payer balance negative.</p>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="button-row">
            <button type="button" className="button button-muted" onClick={handleClose}>Cancel</button>
            <button type="submit" className="button" disabled={!canSubmit}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
