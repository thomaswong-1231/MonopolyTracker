"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { COLOR_GROUP_COLORS } from "@/lib/monopolyData";
import { Player } from "@/lib/types";

interface PropertyOption {
  id: string;
  name: string;
  colorGroup: keyof typeof COLOR_GROUP_COLORS;
  ownerId: string | null;
}

interface PropertyTransferModalProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  properties: PropertyOption[];
  initialFromPlayerId?: string;
  onSave: (args: { fromPlayerId: string; toPlayerId: string; propertyIds: string[]; note?: string }) => { ok: boolean; reason?: string };
}

export function PropertyTransferModal({ open, onClose, players, properties, initialFromPlayerId, onSave }: PropertyTransferModalProps) {
  const [fromPlayerId, setFromPlayerId] = useState(initialFromPlayerId ?? "");
  const [toPlayerId, setToPlayerId] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const transferableProperties = useMemo(
    () => properties.filter((property) => property.ownerId === fromPlayerId),
    [properties, fromPlayerId]
  );

  useEffect(() => {
    if (!open) return;
    setFromPlayerId(initialFromPlayerId ?? "");
    setToPlayerId("");
    setSelectedPropertyIds([]);
    setNote("");
    setError("");
  }, [open, initialFromPlayerId]);

  const canSubmit =
    !!fromPlayerId && !!toPlayerId && fromPlayerId !== toPlayerId && selectedPropertyIds.length > 0 && note.length <= 140;

  if (!open) return null;

  const reset = () => {
    setFromPlayerId("");
    setToPlayerId("");
    setSelectedPropertyIds([]);
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
      setError("Please select both players and at least one property.");
      return;
    }

    const result = onSave({
      fromPlayerId,
      toPlayerId,
      propertyIds: Array.from(new Set(selectedPropertyIds)),
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
      <div className="modal" role="dialog" aria-modal="true" aria-label="Transfer property" onClick={(event) => event.stopPropagation()}>
        <h2>Transfer Property</h2>
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
              <div className="property-checkbox-list">
                {transferableProperties.map((property) => (
                  <label key={property.id} className="property-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedPropertyIds.includes(property.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedPropertyIds((current) => [...current, property.id]);
                        } else {
                          setSelectedPropertyIds((current) => current.filter((id) => id !== property.id));
                        }
                      }}
                    />
                    <span
                      className="property-swatch"
                      style={{ backgroundColor: COLOR_GROUP_COLORS[property.colorGroup] ?? "#94a3b8" }}
                      aria-hidden
                    />
                    <span>{property.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

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
