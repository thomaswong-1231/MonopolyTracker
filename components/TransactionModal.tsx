"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BankPaymentReason, Player, TransactionType } from "@/lib/types";

interface PropertyOption {
  id: string;
  name: string;
  ownerId: string | null;
  purchasePrice: number;
  colorGroup: string;
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
  const colorByGroup: Record<string, string> = {
    Brown: "#8b5a2b",
    "Light Blue": "#7ec8f5",
    Pink: "#ec4899",
    Orange: "#f97316",
    Red: "#ef4444",
    Yellow: "#eab308",
    Green: "#16a34a",
    "Dark Blue": "#1d4ed8",
    Railroad: "#111827",
    Utility: "#9ca3af"
  };

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
  }, [parsedAmount, type, fromPlayerId, toPlayerId, note.length, bankPaymentReason, propertyId, selectedProperty, projectedNegative]);

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
      propertyId: type === "player_to_bank" && bankPaymentReason === "property" ? propertyId : undefined,
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
              <p className="muted tiny">Property</p>
              {availableProperties.length === 0 ? (
                <p className="muted tiny">No unowned properties available.</p>
              ) : (
                <div className="property-checkbox-list">
                  {availableProperties.map((property) => (
                    <label key={property.id} className="property-checkbox-item">
                      <input
                        type="radio"
                        name="transaction-property"
                        checked={propertyId === property.id}
                        onChange={() => setPropertyId(property.id)}
                      />
                      <span
                        className="property-swatch"
                        style={{ backgroundColor: colorByGroup[property.colorGroup] ?? "#94a3b8" }}
                        aria-hidden
                      />
                      <span>{property.name} ({`$${property.purchasePrice}`})</span>
                    </label>
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
