"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { COLOR_GROUP_COLORS } from "@/lib/monopolyData";
import { Player } from "@/lib/types";

interface PropertyOption {
  id: string;
  name: string;
  colorGroup: keyof typeof COLOR_GROUP_COLORS;
  ownerId: string | null;
  currentRentDisplay: string;
}

interface PropertyTransferModalProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  properties: PropertyOption[];
  initialFromPlayerId?: string;
  onSave: (args: {
    fromPlayerId: string;
    toPlayerId: string;
    propertyIds: string[];
    cashFromPlayer?: number;
    note?: string;
  }) => { ok: boolean; reason?: string };
}

export function PropertyTransferModal({ open, onClose, players, properties, initialFromPlayerId, onSave }: PropertyTransferModalProps) {
  const [fromPlayerId, setFromPlayerId] = useState(initialFromPlayerId ?? "");
  const [toPlayerId, setToPlayerId] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [cashFromPlayer, setCashFromPlayer] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const transferableProperties = useMemo(
    () => properties.filter((property) => property.ownerId === fromPlayerId),
    [properties, fromPlayerId]
  );
  const groupedTransferableProperties = useMemo(() => {
    const colorGroupDisplayOrder: Array<keyof typeof COLOR_GROUP_COLORS> = [
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
        properties: transferableProperties.filter((property) => property.colorGroup === group)
      }))
      .filter((entry) => entry.properties.length > 0);
  }, [transferableProperties]);
  const parsedCashFromPlayer = cashFromPlayer === "" ? 0 : Number(cashFromPlayer);
  const fromPlayer = players.find((player) => player.id === fromPlayerId);
  const fromPlayerInsufficient = Number.isInteger(parsedCashFromPlayer) && parsedCashFromPlayer > (fromPlayer?.cash ?? 0);

  useEffect(() => {
    if (!open) return;
    setFromPlayerId(initialFromPlayerId ?? "");
    setToPlayerId("");
    setSelectedPropertyIds([]);
    setCashFromPlayer("");
    setNote("");
    setError("");
  }, [open, initialFromPlayerId]);

  const hasMoneyTrade = parsedCashFromPlayer > 0;
  const moneyFieldsValid =
    Number.isInteger(parsedCashFromPlayer) &&
    parsedCashFromPlayer >= 0;
  const canSubmit =
    !!fromPlayerId &&
    !!toPlayerId &&
    fromPlayerId !== toPlayerId &&
    (selectedPropertyIds.length > 0 || hasMoneyTrade) &&
    moneyFieldsValid &&
    !fromPlayerInsufficient &&
    note.length <= 140;

  if (!open) return null;

  const reset = () => {
    setFromPlayerId("");
    setToPlayerId("");
    setSelectedPropertyIds([]);
    setCashFromPlayer("");
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
      setError("Please select both players and include at least one property or cash amount.");
      return;
    }

    const result = onSave({
      fromPlayerId,
      toPlayerId,
      propertyIds: Array.from(new Set(selectedPropertyIds)),
      cashFromPlayer: parsedCashFromPlayer > 0 ? parsedCashFromPlayer : undefined,
      note: note.trim() || undefined
    });
    if (!result.ok) {
      setError(result.reason ?? "Unable to transfer property.");
      return;
    }

    handleClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Trade Time" onClick={(event) => event.stopPropagation()}>
        <h2>Trade Time</h2>
        <form className="form-stack" onSubmit={onSubmit}>
          <label>
            From Player
            <select
              value={fromPlayerId}
              onChange={(event) => {
                const nextFrom = event.target.value;
                setFromPlayerId(nextFrom);
                const validIds = properties.filter((property) => property.ownerId === nextFrom).map((property) => property.id);
                setSelectedPropertyIds((current) => current.filter((propertyId) => validIds.includes(propertyId)));
              }}
            >
              <option value="">Select player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

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

          <div className="stack">
            <p className="muted tiny">Properties (select one or more)</p>
            {transferableProperties.length === 0 ? (
              <p className="muted tiny">No properties available for this player.</p>
            ) : (
              <div className="trade-property-picker">
                {groupedTransferableProperties.map((group) => (
                  <div key={group.group} className="trade-property-group">
                    {group.properties.map((property) => {
                      const selected = selectedPropertyIds.includes(property.id);
                      const propertyColor = COLOR_GROUP_COLORS[property.colorGroup] ?? "#94a3b8";
                      return (
                        <button
                          key={property.id}
                          type="button"
                          className={`property-row property-row-fancy trade-property-card-button ${selected ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedPropertyIds((current) =>
                              current.includes(property.id)
                                ? current.filter((id) => id !== property.id)
                                : [...current, property.id]
                            );
                          }}
                          aria-pressed={selected}
                          style={{
                            ["--trade-property-color" as string]: propertyColor,
                            ["--trade-property-price-color-light" as string]:
                              property.colorGroup === "Railroad" ? "#111827" : propertyColor,
                            ["--trade-property-price-color-dark" as string]:
                              property.colorGroup === "Railroad" ? "#93c5fd" : propertyColor
                          }}
                        >
                          <span className="property-color-bar trade-property-color-bar" aria-hidden />
                          <div className="property-main buy-property-card-main">
                            <div className="buy-property-card-top">
                              <strong className="buy-property-name">{property.name}</strong>
                            </div>
                            <div className="property-rent-spotlight buy-property-price-box trade-property-rent-box">
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

          <label>
            Cash from {fromPlayer?.name || "From Player"} to {players.find((player) => player.id === toPlayerId)?.name || "To Player"} (optional)
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              step={1}
              value={cashFromPlayer}
              onChange={(event) => setCashFromPlayer(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
            />
          </label>

          {fromPlayerInsufficient && (
            <p className="warning-text">{fromPlayer?.name ?? "From player"} does not have enough cash for this amount.</p>
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

          {error && <p className="error-text">{error}</p>}

          <div className="button-row">
            <button type="button" className="button button-muted" onClick={handleClose}>Cancel</button>
            <button type="submit" className="button" disabled={!canSubmit}>Save Trade</button>
          </div>
        </form>
      </div>
    </div>
  );
}
