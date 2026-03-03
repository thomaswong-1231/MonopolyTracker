export type PropertyType = "street" | "railroad" | "utility";

export type TransactionType = "player_to_bank" | "bank_to_player" | "player_to_player";
export type BankPaymentReason = "tax" | "property";

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  cash: number;
}

export interface PropertyTemplate {
  id: string;
  name: string;
  type: PropertyType;
  colorGroup: string;
  purchasePrice: number;
  mortgageValue: number;
  rent: {
    base: number;
    house1?: number;
    house2?: number;
    house3?: number;
    house4?: number;
    hotel?: number;
    houseCost?: number;
    railroadOwned2?: number;
    railroadOwned3?: number;
    railroadOwned4?: number;
    utilityOneMultiplier?: number;
    utilityBothMultiplier?: number;
  };
}

export interface PropertyState {
  ownerId: string | null;
  houses: number;
  hotel: boolean;
  mortgaged: boolean;
}

export interface PropertyWithState extends PropertyTemplate, PropertyState {}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  eventType: "cash" | "property_owner" | "property_state" | "player" | "game";
  description: string;
  fromPlayerId?: string;
  toPlayerId?: string;
  amount?: number;
  note?: string;
  propertyId?: string;
}

export interface GameSession {
  id: string;
  name: string;
  startingCash: number;
  started: boolean;
  players: Player[];
  properties: Record<string, PropertyState>;
  history: HistoryEntry[];
}

export interface PersistedGameState {
  sessions: GameSession[];
  activeSessionId: string | null;
  undoStacks: Record<string, GameSession[]>;
}
