import { COLOR_GROUP_ORDER, MONOPOLY_PROPERTIES } from "@/lib/monopolyData";
import { GameSession, PropertyTemplate } from "@/lib/types";

const formatMoney = (amount: number) => `$${amount.toLocaleString("en-US")}`;
export const getBuildingUnits = (houses: number, hotel: boolean) => (hotel ? 5 : houses);

const getStreetGroupProperties = (colorGroup: string) =>
  MONOPOLY_PROPERTIES.filter(
    (property) => property.type === "street" && property.colorGroup === colorGroup
  );

export const ownsFullStreetSet = (session: GameSession, playerId: string, colorGroup: string) => {
  const group = getStreetGroupProperties(colorGroup);
  if (group.length === 0) return false;
  return group.every((property) => session.properties[property.id]?.ownerId === playerId);
};

export const getCompleteStreetSetCount = (session: GameSession, playerId: string) =>
  COLOR_GROUP_ORDER.filter((colorGroup) => ownsFullStreetSet(session, playerId, colorGroup)).length;

export const getFullSetRentDisplay = (property: PropertyTemplate) => {
  if (property.type === "street") return formatMoney(property.rent.base * 2);
  if (property.type === "railroad") return formatMoney(property.rent.railroadOwned4 ?? property.rent.base);
  return `${property.rent.utilityBothMultiplier ?? 10}x dice`;
};

export const getCurrentRentDisplay = (session: GameSession, propertyId: string) => {
  const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
  const state = session.properties[propertyId];
  if (!property || !state) return "-";
  if (state.mortgaged) return formatMoney(0);

  if (property.type === "street") {
    if (state.hotel) return formatMoney(property.rent.hotel ?? property.rent.base);
    if (state.houses === 4) return formatMoney(property.rent.house4 ?? property.rent.base);
    if (state.houses === 3) return formatMoney(property.rent.house3 ?? property.rent.base);
    if (state.houses === 2) return formatMoney(property.rent.house2 ?? property.rent.base);
    if (state.houses === 1) return formatMoney(property.rent.house1 ?? property.rent.base);
    const ownerId = state.ownerId;
    if (ownerId && ownsFullStreetSet(session, ownerId, property.colorGroup)) {
      return formatMoney(property.rent.base * 2);
    }
    return formatMoney(property.rent.base);
  }

  if (property.type === "railroad") {
    const ownerId = state.ownerId;
    if (!ownerId) return formatMoney(property.rent.base);
    const ownedCount = MONOPOLY_PROPERTIES.filter(
      (railroad) => railroad.type === "railroad" && session.properties[railroad.id]?.ownerId === ownerId
    ).length;
    if (ownedCount >= 4) return formatMoney(property.rent.railroadOwned4 ?? property.rent.base);
    if (ownedCount === 3) return formatMoney(property.rent.railroadOwned3 ?? property.rent.base);
    if (ownedCount === 2) return formatMoney(property.rent.railroadOwned2 ?? property.rent.base);
    return formatMoney(property.rent.base);
  }

  const ownerId = state.ownerId;
  const utilityOneMultiplier = property.rent.utilityOneMultiplier ?? 4;
  const utilityBothMultiplier = property.rent.utilityBothMultiplier ?? 10;
  if (!ownerId) return `${utilityOneMultiplier}x dice`;

  const ownedUtilityCount = MONOPOLY_PROPERTIES.filter(
    (entry) => entry.type === "utility" && session.properties[entry.id]?.ownerId === ownerId
  ).length;
  return ownedUtilityCount >= 2 ? `${utilityBothMultiplier}x dice` : `${utilityOneMultiplier}x dice`;
};

export const getHousePurchaseEligibility = (
  session: GameSession,
  propertyId: string
): { canBuy: boolean; reason?: string } => {
  const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
  const state = session.properties[propertyId];
  if (!property || !state) return { canBuy: false, reason: "Invalid property" };
  if (property.type !== "street") return { canBuy: false, reason: "Only streets can have houses" };
  if (!state.ownerId) return { canBuy: false, reason: "Property must be owned first" };
  if (state.mortgaged) return { canBuy: false, reason: "Cannot build on a mortgaged property" };
  if (state.hotel || state.houses >= 4) return { canBuy: false, reason: "Maximum houses reached" };

  const group = getStreetGroupProperties(property.colorGroup);
  if (group.length === 0) return { canBuy: false, reason: "Invalid color group" };

  const hasFullSet = group.every((entry) => session.properties[entry.id]?.ownerId === state.ownerId);
  if (!hasFullSet) return { canBuy: false, reason: "Own the full color set first" };

  const groupStates = group.map((entry) => session.properties[entry.id]);
  if (groupStates.some((entry) => entry?.mortgaged)) {
    return { canBuy: false, reason: "Unmortgage all properties in this set first" };
  }

  const groupUnits = groupStates.map((entry) => getBuildingUnits(entry?.houses ?? 0, entry?.hotel ?? false));
  const currentUnits = getBuildingUnits(state.houses, state.hotel);
  const nextUnits = groupUnits.map((units, index) => {
    const groupPropertyId = group[index]?.id;
    return groupPropertyId === propertyId ? currentUnits + 1 : units;
  });
  const difference = Math.max(...nextUnits) - Math.min(...nextUnits);
  if (difference > 1) {
    return { canBuy: false, reason: "Cannot build: highest in set would exceed lowest by more than 1 house" };
  }

  return { canBuy: true };
};

export const getHotelPurchaseEligibility = (
  session: GameSession,
  propertyId: string
): { canBuy: boolean; reason?: string } => {
  const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
  const state = session.properties[propertyId];
  if (!property || !state) return { canBuy: false, reason: "Invalid property" };
  if (property.type !== "street") return { canBuy: false, reason: "Only streets can have hotels" };
  if (!state.ownerId) return { canBuy: false, reason: "Property must be owned first" };
  if (state.mortgaged) return { canBuy: false, reason: "Cannot build on a mortgaged property" };
  if (state.hotel) return { canBuy: false, reason: "Hotel already built" };
  if (state.houses !== 4) return { canBuy: false, reason: "Need 4 houses before buying a hotel" };

  const group = getStreetGroupProperties(property.colorGroup);
  const hasFullSet = group.every((entry) => session.properties[entry.id]?.ownerId === state.ownerId);
  if (!hasFullSet) return { canBuy: false, reason: "Own the full color set first" };
  if (group.some((entry) => session.properties[entry.id]?.mortgaged)) {
    return { canBuy: false, reason: "Unmortgage all properties in this set first" };
  }
  const groupUnits = group.map((entry) =>
    getBuildingUnits(session.properties[entry.id]?.houses ?? 0, session.properties[entry.id]?.hotel ?? false)
  );
  const nextUnits = groupUnits.map((units, index) => (group[index]?.id === propertyId ? 5 : units));
  const difference = Math.max(...nextUnits) - Math.min(...nextUnits);
  if (difference > 1) {
    return { canBuy: false, reason: "Cannot build: highest in set would exceed lowest by more than 1 house" };
  }

  return { canBuy: true };
};

export const getHouseSaleEligibility = (
  session: GameSession,
  propertyId: string
): { canSell: boolean; reason?: string } => {
  const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
  const state = session.properties[propertyId];
  if (!property || !state) return { canSell: false, reason: "Invalid property" };
  if (property.type !== "street") return { canSell: false, reason: "Only streets can sell houses" };
  if (!state.ownerId) return { canSell: false, reason: "Property must be owned first" };
  const currentUnits = getBuildingUnits(state.houses, state.hotel);
  if (currentUnits <= 0) return { canSell: false, reason: "No houses to sell" };

  const group = getStreetGroupProperties(property.colorGroup);
  const hasFullSet = group.every((entry) => session.properties[entry.id]?.ownerId === state.ownerId);
  if (hasFullSet) {
    const groupUnits = group.map((entry) =>
      getBuildingUnits(session.properties[entry.id]?.houses ?? 0, session.properties[entry.id]?.hotel ?? false)
    );
    const nextUnits = groupUnits.map((units, index) => {
      if (group[index]?.id !== propertyId) return units;
      return Math.max(0, units - 1);
    });
    const difference = Math.max(...nextUnits) - Math.min(...nextUnits);
    if (difference > 1) {
      return { canSell: false, reason: "Cannot sell here: set spread would exceed 1 house" };
    }
  }
  return { canSell: true };
};
