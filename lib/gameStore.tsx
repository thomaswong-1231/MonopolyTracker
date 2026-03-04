"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { MONOPOLY_PROPERTIES } from "@/lib/monopolyData";
import {
  getHotelPurchaseEligibility,
  getHousePurchaseEligibility,
  getHouseSaleEligibility,
  ownsFullStreetSet
} from "@/lib/propertyRules";
import { BankPaymentReason, GameSession, HistoryEntry, PersistedGameState, Player, TransactionType } from "@/lib/types";

const STORAGE_KEY = "monopoly_tracker_state_v2";
const TOAST_LIFETIME_MS = 2500;
const MAX_UNDO_SNAPSHOTS = 40;
const MAX_HISTORY_ENTRIES = 300;

interface Toast {
  id: string;
  message: string;
}

interface GameContextValue {
  sessions: GameSession[];
  activeSessionId: string | null;
  session: GameSession | null;
  undoCount: number;
  storageError: boolean;
  toasts: Toast[];
  createGame: (name: string, startingCash: number) => void;
  setActiveSession: (sessionId: string) => void;
  deleteGame: (sessionId: string) => void;
  setStarted: (started: boolean) => void;
  updateGameDetails: (name: string, startingCash: number) => void;
  addPlayer: (name: string, color: string, avatar?: string) => { ok: boolean; reason?: string };
  editPlayer: (playerId: string, updates: Pick<Player, "name" | "color" | "avatar">) => void;
  removePlayer: (playerId: string) => void;
  recordTransaction: (args: {
    type: TransactionType;
    amount: number;
    fromPlayerId?: string;
    toPlayerId?: string;
    bankPaymentReason?: BankPaymentReason;
    propertyId?: string;
    note?: string;
  }) => { ok: boolean; reason?: string };
  transferProperty: (args: {
    fromPlayerId: string;
    toPlayerId: string;
    propertyIds: string[];
    note?: string;
  }) => { ok: boolean; reason?: string };
  buyHouse: (propertyId: string) => { ok: boolean; reason?: string };
  sellHouse: (propertyId: string) => { ok: boolean; reason?: string };
  buyHotel: (propertyId: string) => { ok: boolean; reason?: string };
  mortgageProperty: (propertyId: string) => { ok: boolean; reason?: string };
  unmortgageProperty: (propertyId: string) => { ok: boolean; reason?: string };
  setPropertyOwner: (propertyId: string, ownerId: string | null) => void;
  setPropertyState: (propertyId: string, updates: { houses?: number; hotel?: boolean; mortgaged?: boolean }) => { ok: boolean; reason?: string };
  undoLastAction: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const blankProperties = () =>
  Object.fromEntries(
    MONOPOLY_PROPERTIES.map((property) => [
      property.id,
      { ownerId: null, houses: 0, hotel: false, mortgaged: false }
    ])
  );

const getInitialState = (): PersistedGameState => ({
  sessions: [],
  activeSessionId: null,
  undoStacks: {}
});

const migrateStore = (value: unknown): PersistedGameState => {
  const candidate = value as Partial<PersistedGameState> & {
    session?: GameSession | null;
    undoStack?: GameSession[];
  };

  if (Array.isArray(candidate?.sessions) && typeof candidate?.undoStacks === "object") {
    return {
      sessions: candidate.sessions,
      activeSessionId: candidate.activeSessionId ?? candidate.sessions[0]?.id ?? null,
      undoStacks: candidate.undoStacks ?? {}
    };
  }

  if (candidate?.session && Array.isArray(candidate.undoStack)) {
    return {
      sessions: [candidate.session],
      activeSessionId: candidate.session.id,
      undoStacks: { [candidate.session.id]: candidate.undoStack }
    };
  }

  return getInitialState();
};

const playerName = (session: GameSession, playerId?: string) =>
  session.players.find((player) => player.id === playerId)?.name ?? "Unknown Player";

const pushHistory = (session: GameSession, entry: Omit<HistoryEntry, "id" | "timestamp">) => {
  session.history.unshift({ id: uid(), timestamp: new Date().toISOString(), ...entry });
  if (session.history.length > MAX_HISTORY_ENTRIES) {
    session.history = session.history.slice(0, MAX_HISTORY_ENTRIES);
  }
};

const calculateNetWorth = (session: GameSession, playerId: string) => {
  const player = session.players.find((item) => item.id === playerId);
  if (!player) return 0;

  const propertyWorth = MONOPOLY_PROPERTIES.reduce((total, property) => {
    const propertyState = session.properties[property.id];
    if (!propertyState || propertyState.ownerId !== playerId) return total;

    const propertyValue = propertyState.mortgaged ? 0 : property.mortgageValue;
    const houseUnits = propertyState.hotel ? 5 : propertyState.houses;
    const liquidationPerUnit = Math.floor((property.rent.houseCost ?? 0) / 2);
    const houseLiquidationValue = houseUnits * liquidationPerUnit;

    return total + propertyValue + houseLiquidationValue;
  }, 0);

  return player.cash + propertyWorth;
};

const calculateUnmortgageValue = (mortgageValue: number) => Math.ceil(mortgageValue * 1.1);

const findSessionIndex = (store: PersistedGameState, sessionId: string | null) =>
  sessionId ? store.sessions.findIndex((item) => item.id === sessionId) : -1;

const compactStoreForStorage = (state: PersistedGameState): PersistedGameState => ({
  ...state,
  sessions: state.sessions.map((session) => ({
    ...session,
    history: session.history.slice(0, MAX_HISTORY_ENTRIES)
  })),
  undoStacks: Object.fromEntries(
    Object.entries(state.undoStacks).map(([sessionId, stack]) => [sessionId, stack.slice(0, MAX_UNDO_SNAPSHOTS)])
  )
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<PersistedGameState>(getInitialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string) => {
    const id = uid();
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_LIFETIME_MS);
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("monopoly_tracker_state_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        setStore(migrateStore(parsed));
      }
      setStorageError(false);
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem("monopoly_tracker_state_v1");
      } catch {
      }
      setStorageError(true);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      window.localStorage.removeItem("monopoly_tracker_state_v1");
      setStorageError(false);
    } catch {
      try {
        const compacted = compactStoreForStorage(store);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
        window.localStorage.removeItem("monopoly_tracker_state_v1");
        setStore(compacted);
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    }
  }, [store, isLoaded]);

  const session = useMemo(() => {
    const index = findSessionIndex(store, store.activeSessionId);
    return index >= 0 ? store.sessions[index] : null;
  }, [store]);

  const undoCount = useMemo(() => {
    if (!store.activeSessionId) return 0;
    return store.undoStacks[store.activeSessionId]?.length ?? 0;
  }, [store]);

  const createGame = (name: string, startingCash: number) => {
    const nextSession: GameSession = {
      id: uid(),
      name,
      startingCash,
      started: false,
      players: [],
      properties: blankProperties(),
      history: []
    };

    setStore((current) => ({
      sessions: [nextSession, ...current.sessions],
      activeSessionId: nextSession.id,
      undoStacks: { ...current.undoStacks, [nextSession.id]: [] }
    }));
    showToast("Game created");
  };

  const setActiveSession = (sessionId: string) => {
    setStore((current) => {
      if (!current.sessions.some((item) => item.id === sessionId)) return current;
      return { ...current, activeSessionId: sessionId };
    });
  };

  const deleteGame = (sessionId: string) => {
    let removed = false;
    setStore((current) => {
      if (!current.sessions.some((item) => item.id === sessionId)) return current;
      removed = true;
      const sessions = current.sessions.filter((item) => item.id !== sessionId);
      const undoStacks = { ...current.undoStacks };
      delete undoStacks[sessionId];

      const activeSessionId =
        current.activeSessionId === sessionId ? (sessions[0]?.id ?? null) : current.activeSessionId;

      return { sessions, activeSessionId, undoStacks };
    });

    if (removed) {
      showToast("Game deleted");
    }
  };

  const updateCurrentSession = (
    mutator: (session: GameSession) => boolean,
    options?: { pushUndo?: boolean; toast?: string }
  ) => {
    let changed = false;
    setStore((current) => {
      const index = findSessionIndex(current, current.activeSessionId);
      if (index < 0) return current;

      const existing = current.sessions[index];
      const before = clone(existing);
      const updated = clone(existing);

      if (!mutator(updated)) {
        return current;
      }

      changed = true;
      const sessions = [...current.sessions];
      sessions[index] = updated;

      let undoStacks = current.undoStacks;
      if (options?.pushUndo) {
        const nextUndoStack = [before, ...(current.undoStacks[updated.id] ?? [])].slice(0, MAX_UNDO_SNAPSHOTS);
        undoStacks = {
          ...current.undoStacks,
          [updated.id]: nextUndoStack
        };
      }

      return {
        ...current,
        sessions,
        undoStacks
      };
    });

    if (changed && options?.toast) {
      showToast(options.toast);
    }

    return changed;
  };

  const setStarted = (started: boolean) => {
    updateCurrentSession((currentSession) => {
      if (currentSession.started === started) return false;
      currentSession.started = started;
      return true;
    });
  };

  const updateGameDetails = (name: string, startingCash: number) => {
    updateCurrentSession(
      (currentSession) => {
        currentSession.name = name;
        currentSession.startingCash = startingCash;
        pushHistory(currentSession, { eventType: "game", description: "Updated game settings" });
        return true;
      },
      { pushUndo: true, toast: "Game settings updated" }
    );
  };

  const addPlayer: GameContextValue["addPlayer"] = (name, color, avatar) => {
    let reason = "Unable to add player";
    const ok = updateCurrentSession(
      (currentSession) => {
        if (currentSession.players.length >= 10) {
          reason = "Maximum 10 players reached";
          return false;
        }

        const trimmedName = name.trim();
        const player: Player = {
          id: uid(),
          name: trimmedName,
          color,
          avatar: avatar?.trim() || trimmedName.slice(0, 1).toUpperCase() || "?",
          cash: currentSession.startingCash
        };

        currentSession.players.push(player);
        pushHistory(currentSession, {
          eventType: "player",
          description: `Added player ${player.name}`,
          toPlayerId: player.id
        });

        return true;
      },
      { pushUndo: true, toast: "Player added" }
    );

    if (!ok && !reason) {
      reason = "Action could not be completed. Please try again.";
    }
    return ok ? { ok: true } : { ok: false, reason };
  };

  const editPlayer = (playerId: string, updates: Pick<Player, "name" | "color" | "avatar">) => {
    updateCurrentSession(
      (currentSession) => {
        const found = currentSession.players.find((item) => item.id === playerId);
        if (!found) return false;

        found.name = updates.name.trim();
        found.color = updates.color;
        found.avatar = updates.avatar.trim() || found.name.slice(0, 1).toUpperCase() || "?";
        pushHistory(currentSession, {
          eventType: "player",
          description: `Edited player ${found.name}`,
          toPlayerId: found.id
        });
        return true;
      },
      { pushUndo: true, toast: "Player updated" }
    );
  };

  const removePlayer = (playerId: string) => {
    updateCurrentSession(
      (currentSession) => {
        const player = currentSession.players.find((item) => item.id === playerId);
        if (!player) return false;

        currentSession.players = currentSession.players.filter((item) => item.id !== playerId);

        Object.values(currentSession.properties).forEach((propertyState) => {
          if (propertyState.ownerId === playerId) {
            propertyState.ownerId = null;
            propertyState.houses = 0;
            propertyState.hotel = false;
            propertyState.mortgaged = false;
          }
        });

        pushHistory(currentSession, {
          eventType: "player",
          description: `Removed player ${player.name} and unowned their properties`,
          fromPlayerId: playerId
        });

        return true;
      },
      { pushUndo: true, toast: "Player removed" }
    );
  };

  const recordTransaction: GameContextValue["recordTransaction"] = ({
    type,
    amount,
    fromPlayerId,
    toPlayerId,
    bankPaymentReason,
    propertyId,
    note
  }) => {
    let reason: string | undefined = "Unable to save transaction";

    const ok = updateCurrentSession(
      (currentSession) => {
        if (!Number.isInteger(amount) || amount <= 0) {
          reason = "Amount must be a whole number greater than 0";
          return false;
        }

        const fromPlayer = fromPlayerId
          ? currentSession.players.find((item) => item.id === fromPlayerId)
          : undefined;
        const toPlayer = toPlayerId ? currentSession.players.find((item) => item.id === toPlayerId) : undefined;

        if (type === "player_to_bank") {
          if (!fromPlayer) {
            reason = "Select a player to pay the bank";
            return false;
          }
          let effectiveAmount = amount;
          if (bankPaymentReason === "property") {
            if (!propertyId) {
              reason = "Select a property for this purchase";
              return false;
            }
            const propertyTemplate = MONOPOLY_PROPERTIES.find((property) => property.id === propertyId);
            if (!propertyTemplate) {
              reason = "Selected property is invalid";
              return false;
            }
            const propertyState = currentSession.properties[propertyId];
            if (!propertyState) {
              reason = "Selected property is unavailable";
              return false;
            }
            if (propertyState.ownerId) {
              reason = "Property is already owned";
              return false;
            }
            propertyState.ownerId = fromPlayer.id;
            propertyState.houses = 0;
            propertyState.hotel = false;
            propertyState.mortgaged = false;
            pushHistory(currentSession, {
              eventType: "property_owner",
              description: `${propertyTemplate.name} owner set to ${fromPlayer.name}`,
              toPlayerId: fromPlayer.id,
              propertyId
            });
          }
          if (fromPlayer.cash < effectiveAmount) {
            reason = `${fromPlayer.name} does not have enough cash`;
            return false;
          }
          fromPlayer.cash -= effectiveAmount;
          pushHistory(currentSession, {
            eventType: "cash",
            description:
              bankPaymentReason === "property"
                ? `${fromPlayer.name} bought property from bank for $${effectiveAmount}`
                : bankPaymentReason === "tax"
                  ? `${fromPlayer.name} paid tax to bank $${effectiveAmount}`
                  : `${fromPlayer.name} paid bank $${effectiveAmount}`,
            fromPlayerId: fromPlayer.id,
            amount: effectiveAmount,
            note: note?.trim()
          });
          return true;
        }

        if (type === "bank_to_player") {
          if (!toPlayer) {
            reason = "Select a player to receive from the bank";
            return false;
          }
          toPlayer.cash += amount;
          pushHistory(currentSession, {
            eventType: "cash",
            description: `Bank paid ${toPlayer.name} $${amount}`,
            toPlayerId: toPlayer.id,
            amount,
            note: note?.trim()
          });
          return true;
        }

        if (!fromPlayer || !toPlayer) {
          reason = "Select both payer and receiver";
          return false;
        }
        if (fromPlayer.id === toPlayer.id) {
          reason = "Payer and receiver cannot be the same player";
          return false;
        }
        if (fromPlayer.cash < amount) {
          reason = `${fromPlayer.name} does not have enough cash`;
          return false;
        }
        fromPlayer.cash -= amount;
        toPlayer.cash += amount;
        pushHistory(currentSession, {
          eventType: "cash",
          description: `${fromPlayer.name} paid ${toPlayer.name} $${amount}`,
          fromPlayerId: fromPlayer.id,
          toPlayerId: toPlayer.id,
          amount,
          note: note?.trim()
        });

        return true;
      },
      { pushUndo: true, toast: "Transaction saved" }
    );

    if (!ok && !reason) {
      reason = "Action could not be completed. Please try again.";
    }
    return ok ? { ok: true } : { ok: false, reason };
  };

  const transferProperty: GameContextValue["transferProperty"] = ({
    fromPlayerId,
    toPlayerId,
    propertyIds,
    note
  }) => {
    let reason: string | undefined = "Unable to transfer property";

    const ok = updateCurrentSession(
      (currentSession) => {
        const fromPlayer = currentSession.players.find((item) => item.id === fromPlayerId);
        const toPlayer = currentSession.players.find((item) => item.id === toPlayerId);
        if (!fromPlayer || !toPlayer) {
          reason = "Select both players";
          return false;
        }
        if (fromPlayerId === toPlayerId) {
          reason = "Players must be different";
          return false;
        }

        const uniquePropertyIds = Array.from(new Set(propertyIds));
        if (uniquePropertyIds.length === 0) {
          reason = "Select at least one property";
          return false;
        }

        for (const propertyId of uniquePropertyIds) {
          const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
          const propertyState = currentSession.properties[propertyId];
          if (!property || !propertyState) {
            reason = "Select a valid property";
            return false;
          }
          if (propertyState.ownerId !== fromPlayerId) {
            reason = `${property.name} is not owned by ${fromPlayer.name}`;
            return false;
          }
        }

        for (const propertyId of uniquePropertyIds) {
          const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
          const propertyState = currentSession.properties[propertyId];
          if (!property || !propertyState) continue;

          propertyState.ownerId = toPlayerId;
          pushHistory(currentSession, {
            eventType: "property_owner",
            description: `${fromPlayer.name} transferred ${property.name} to ${toPlayer.name}`,
            fromPlayerId,
            toPlayerId,
            propertyId,
            note: note?.trim()
          });
        }
        return true;
      },
      { pushUndo: true, toast: propertyIds.length > 1 ? "Properties transferred" : "Property transferred" }
    );

    if (!ok && !reason) {
      reason = "Action could not be completed. Please try again.";
    }
    return ok ? { ok: true } : { ok: false, reason };
  };

  const buyHouse: GameContextValue["buyHouse"] = (propertyId) => {
    let reason: string | undefined = "Unable to buy house";

    const ok = updateCurrentSession(
      (currentSession) => {
        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        const state = currentSession.properties[propertyId];
        if (!property || !state) {
          reason = "Invalid property";
          return false;
        }

        const eligibility = getHousePurchaseEligibility(currentSession, propertyId);
        if (!eligibility.canBuy) {
          reason = eligibility.reason ?? "Cannot add more houses to this color set";
          return false;
        }

        const owner = currentSession.players.find((player) => player.id === state.ownerId);
        if (!owner) {
          reason = "Property owner not found";
          return false;
        }

        const houseCost = property.rent.houseCost ?? 0;
        if (owner.cash < houseCost) {
          reason = `${owner.name} does not have enough cash`;
          return false;
        }
        owner.cash -= houseCost;
        state.houses += 1;

        pushHistory(currentSession, {
          eventType: "cash",
          description: `${owner.name} bought a house on ${property.name} for $${houseCost}`,
          fromPlayerId: owner.id,
          amount: houseCost,
          propertyId
        });
        pushHistory(currentSession, {
          eventType: "property_state",
          description: `${property.name} now has ${state.houses} house${state.houses === 1 ? "" : "s"}`,
          toPlayerId: owner.id,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "House purchased" }
    );

    return ok ? { ok: true } : { ok: false, reason };
  };

  const sellHouse: GameContextValue["sellHouse"] = (propertyId) => {
    let reason: string | undefined;

    const ok = updateCurrentSession(
      (currentSession) => {
        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        const state = currentSession.properties[propertyId];
        if (!property || !state) {
          reason = "Invalid property";
          return false;
        }

        const eligibility = getHouseSaleEligibility(currentSession, propertyId);
        if (!eligibility.canSell) {
          reason = eligibility.reason ?? "Cannot sell house from this property";
          return false;
        }

        const owner = currentSession.players.find((player) => player.id === state.ownerId);
        if (!owner) {
          reason = "Property owner not found";
          return false;
        }

        const saleValue = Math.floor((property.rent.houseCost ?? 0) / 2);
        if (state.hotel) {
          state.hotel = false;
          state.houses = 4;
        } else {
          state.houses -= 1;
        }
        owner.cash += saleValue;

        pushHistory(currentSession, {
          eventType: "cash",
          description: `${owner.name} sold a house on ${property.name} for $${saleValue}`,
          toPlayerId: owner.id,
          amount: saleValue,
          propertyId
        });
        pushHistory(currentSession, {
          eventType: "property_state",
          description: `${property.name} now has ${state.houses} house${state.houses === 1 ? "" : "s"}`,
          toPlayerId: owner.id,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "House sold" }
    );

    if (!ok && !reason) {
      reason = "Sell house action is not available right now";
    }
    return ok ? { ok: true } : { ok: false, reason };
  };

  const buyHotel: GameContextValue["buyHotel"] = (propertyId) => {
    let reason: string | undefined = "Unable to buy hotel";

    const ok = updateCurrentSession(
      (currentSession) => {
        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        const state = currentSession.properties[propertyId];
        if (!property || !state) {
          reason = "Invalid property";
          return false;
        }

        const eligibility = getHotelPurchaseEligibility(currentSession, propertyId);
        if (!eligibility.canBuy) {
          reason = eligibility.reason ?? "Cannot buy hotel on this property";
          return false;
        }

        const owner = currentSession.players.find((player) => player.id === state.ownerId);
        if (!owner) {
          reason = "Property owner not found";
          return false;
        }

        const hotelCost = property.rent.houseCost ?? 0;
        if (owner.cash < hotelCost) {
          reason = `${owner.name} does not have enough cash`;
          return false;
        }
        owner.cash -= hotelCost;
        state.houses = 0;
        state.hotel = true;

        pushHistory(currentSession, {
          eventType: "cash",
          description: `${owner.name} bought a hotel on ${property.name} for $${hotelCost}`,
          fromPlayerId: owner.id,
          amount: hotelCost,
          propertyId
        });
        pushHistory(currentSession, {
          eventType: "property_state",
          description: `${property.name} now has a hotel`,
          toPlayerId: owner.id,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "Hotel purchased" }
    );

    return ok ? { ok: true } : { ok: false, reason };
  };

  const mortgageProperty: GameContextValue["mortgageProperty"] = (propertyId) => {
    let reason: string | undefined = "Unable to mortgage property";

    const ok = updateCurrentSession(
      (currentSession) => {
        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        const propertyState = currentSession.properties[propertyId];
        if (!property || !propertyState) {
          reason = "Invalid property";
          return false;
        }
        if (!propertyState.ownerId) {
          reason = "Property must be owned before mortgaging";
          return false;
        }
        if (propertyState.mortgaged) {
          reason = "Property is already mortgaged";
          return false;
        }
        if (propertyState.houses > 0 || propertyState.hotel) {
          reason = "Sell houses and hotel before mortgaging";
          return false;
        }

        const owner = currentSession.players.find((player) => player.id === propertyState.ownerId);
        if (!owner) {
          reason = "Property owner not found";
          return false;
        }

        propertyState.mortgaged = true;
        owner.cash += property.mortgageValue;

        pushHistory(currentSession, {
          eventType: "cash",
          description: `${owner.name} mortgaged ${property.name} for $${property.mortgageValue}`,
          toPlayerId: owner.id,
          amount: property.mortgageValue,
          propertyId
        });
        pushHistory(currentSession, {
          eventType: "property_state",
          description: `${property.name} set to mortgaged`,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "Property mortgaged" }
    );

    return ok ? { ok: true } : { ok: false, reason };
  };

  const unmortgageProperty: GameContextValue["unmortgageProperty"] = (propertyId) => {
    let reason: string | undefined = "Unable to unmortgage property";

    const ok = updateCurrentSession(
      (currentSession) => {
        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        const propertyState = currentSession.properties[propertyId];
        if (!property || !propertyState) {
          reason = "Invalid property";
          return false;
        }
        if (!propertyState.ownerId) {
          reason = "Property must be owned before unmortgaging";
          return false;
        }
        if (!propertyState.mortgaged) {
          reason = "Property is not mortgaged";
          return false;
        }

        const owner = currentSession.players.find((player) => player.id === propertyState.ownerId);
        if (!owner) {
          reason = "Property owner not found";
          return false;
        }

        const unmortgageValue = calculateUnmortgageValue(property.mortgageValue);
        if (owner.cash < unmortgageValue) {
          reason = `${owner.name} does not have enough cash to unmortgage`;
          return false;
        }
        owner.cash -= unmortgageValue;
        propertyState.mortgaged = false;

        pushHistory(currentSession, {
          eventType: "cash",
          description: `${owner.name} paid $${unmortgageValue} to unmortgage ${property.name}`,
          fromPlayerId: owner.id,
          amount: unmortgageValue,
          propertyId
        });
        pushHistory(currentSession, {
          eventType: "property_state",
          description: `${property.name} set to unmortgaged`,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "Property unmortgaged" }
    );

    return ok ? { ok: true } : { ok: false, reason };
  };

  const setPropertyOwner = (propertyId: string, ownerId: string | null) => {
    updateCurrentSession(
      (currentSession) => {
        const currentState = currentSession.properties[propertyId];
        if (!currentState || currentState.ownerId === ownerId) return false;

        currentSession.properties[propertyId].ownerId = ownerId;

        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        const ownerText = ownerId ? playerName(currentSession, ownerId) : "Unowned";
        pushHistory(currentSession, {
          eventType: "property_owner",
          description: `${property?.name ?? "Property"} owner set to ${ownerText}`,
          toPlayerId: ownerId || undefined,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "Property owner updated" }
    );
  };

  const setPropertyState = (propertyId: string, updates: { houses?: number; hotel?: boolean; mortgaged?: boolean }) => {
    let reason: string | undefined;
    const ok = updateCurrentSession(
      (currentSession) => {
        const propertyState = currentSession.properties[propertyId];
        if (!propertyState) return false;
        const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
        if (!property) return false;

        let nextHouses = updates.houses ?? propertyState.houses;
        let nextHotel = updates.hotel ?? propertyState.hotel;
        const nextMortgaged = updates.mortgaged ?? propertyState.mortgaged;

        nextHouses = Math.max(0, Math.min(4, Math.trunc(nextHouses)));
        if (nextHotel) {
          nextHouses = 0;
        }
        if (nextHouses > 0) {
          nextHotel = false;
        }
        const addingHouse = nextHouses > propertyState.houses;
        const addingHotel = nextHotel && !propertyState.hotel;

        if (propertyState.mortgaged && (addingHouse || addingHotel)) {
          reason = "Cannot build on a mortgaged property";
          return false;
        }
        if (property.type === "street" && (addingHouse || addingHotel)) {
          if (!propertyState.ownerId) {
            reason = "Property must be owned before building";
            return false;
          }
          if (!ownsFullStreetSet(currentSession, propertyState.ownerId, property.colorGroup)) {
            reason = "Build houses only after owning the full color set";
            return false;
          }
        }
        if (addingHotel && propertyState.houses < 4) {
          reason = "Build 4 houses before adding a hotel";
          return false;
        }

        if (
          propertyState.houses === nextHouses &&
          propertyState.hotel === nextHotel &&
          propertyState.mortgaged === nextMortgaged
        ) {
          return false;
        }

        propertyState.houses = nextHouses;
        propertyState.hotel = nextHotel;
        propertyState.mortgaged = nextMortgaged;

        pushHistory(currentSession, {
          eventType: "property_state",
          description: `${property?.name ?? "Property"} updated (houses: ${nextHouses}, hotel: ${nextHotel ? "yes" : "no"}, mortgaged: ${nextMortgaged ? "yes" : "no"})`,
          propertyId
        });

        return true;
      },
      { pushUndo: true, toast: "Property state updated" }
    );
    return ok ? { ok: true } : { ok: false, reason };
  };

  const undoLastAction = () => {
    let undone = false;
    setStore((current) => {
      const index = findSessionIndex(current, current.activeSessionId);
      if (index < 0 || !current.activeSessionId) return current;

      const currentUndoStack = current.undoStacks[current.activeSessionId] ?? [];
      if (currentUndoStack.length === 0) return current;

      const [last, ...remaining] = currentUndoStack;
      const sessions = [...current.sessions];
      sessions[index] = last;
      undone = true;

      return {
        ...current,
        sessions,
        undoStacks: {
          ...current.undoStacks,
          [current.activeSessionId]: remaining
        }
      };
    });

    if (undone) {
      showToast("Undone");
    }
  };

  const resetGame = () => {
    if (!store.activeSessionId) return;
    deleteGame(store.activeSessionId);
  };

  const value = useMemo<GameContextValue>(
    () => ({
      sessions: store.sessions,
      activeSessionId: store.activeSessionId,
      session,
      undoCount,
      storageError,
      toasts,
      createGame,
      setActiveSession,
      deleteGame,
      setStarted,
      updateGameDetails,
      addPlayer,
      editPlayer,
      removePlayer,
      recordTransaction,
      transferProperty,
      buyHouse,
      sellHouse,
      buyHotel,
      mortgageProperty,
      unmortgageProperty,
      setPropertyOwner,
      setPropertyState,
      undoLastAction,
      resetGame
    }),
    [store, session, undoCount, storageError, toasts]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}

export const money = (amount: number) => `$${amount.toLocaleString("en-US")}`;

export { calculateNetWorth, calculateUnmortgageValue };
