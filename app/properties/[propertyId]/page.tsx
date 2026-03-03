"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { COLOR_GROUP_COLORS, MONOPOLY_PROPERTIES } from "@/lib/monopolyData";
import {
  getBuildingUnits,
  getCurrentRentDisplay,
  getFullSetRentDisplay,
  getHotelPurchaseEligibility,
  getHouseSaleEligibility,
  getHousePurchaseEligibility,
  ownsFullStreetSet
} from "@/lib/propertyRules";
import { calculateUnmortgageValue, money, useGame } from "@/lib/gameStore";

export default function PropertyDetailPage() {
  const params = useParams<{ propertyId: string }>();
  const router = useRouter();
  const { buyHouse, buyHotel, sellHouse, session, mortgageProperty, setPropertyOwner, unmortgageProperty } = useGame();

  const property = useMemo(
    () => MONOPOLY_PROPERTIES.find((item) => item.id === params.propertyId),
    [params.propertyId]
  );

  if (!session) {
    return (
      <section className="card stack">
        <h1>No active game</h1>
        <button className="button" onClick={() => router.push("/")}>Go Home</button>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="card stack">
        <h1>Property not found</h1>
        <Link className="button" href="/properties">Back to properties</Link>
      </section>
    );
  }

  const state = session.properties[property.id];
  const propertyTypeLabel = property.type.charAt(0).toUpperCase() + property.type.slice(1);
  const houseEligibility = getHousePurchaseEligibility(session, property.id);
  const hotelEligibility = getHotelPurchaseEligibility(session, property.id);
  const saleEligibility = getHouseSaleEligibility(session, property.id);
  const owner = session.players.find((entry) => entry.id === state.ownerId);
  const canAffordHouse = (owner?.cash ?? 0) >= (property.rent.houseCost ?? 0);
  const canAffordHotel = (owner?.cash ?? 0) >= (property.rent.houseCost ?? 0);
  const canAffordUnmortgage = (owner?.cash ?? 0) >= calculateUnmortgageValue(property.mortgageValue);
  const ownerHasFullSet =
    property.type === "street" && state.ownerId
      ? ownsFullStreetSet(session, state.ownerId, property.colorGroup)
      : false;
  const canBuildHouses = property.type === "street" && !!state.ownerId && ownerHasFullSet && !state.mortgaged;
  const buildingUnits = getBuildingUnits(state.houses, state.hotel);

  return (
    <section className="stack">
      <div className="card stack">
        <h1>{property.name}</h1>
        <p className="muted">
          {propertyTypeLabel} · Price {money(property.purchasePrice)} · Mortgage {money(property.mortgageValue)}
        </p>
        <p className="muted tiny">
          Current rent: {getCurrentRentDisplay(session, property.id)} · Full set rent: {getFullSetRentDisplay(property)}
        </p>

        <div className="title-deed">
          <div
            className="title-deed-header"
            style={{ backgroundColor: COLOR_GROUP_COLORS[property.colorGroup] ?? "#86d6ff" }}
          >
            <p className="title-deed-label">TITLE DEED</p>
            <strong>{property.name}</strong>
          </div>

          {property.type === "street" ? (
            <div className="rent-table">
              <p><strong>RENT {money(property.rent.base)}</strong></p>
              <p>With Full Set (no houses) <strong>{money(property.rent.base * 2)}</strong></p>
              <p>With 1 House <strong>{money(property.rent.house1 ?? property.rent.base)}</strong></p>
              <p>With 2 Houses <strong>{money(property.rent.house2 ?? property.rent.base)}</strong></p>
              <p>With 3 Houses <strong>{money(property.rent.house3 ?? property.rent.base)}</strong></p>
              <p>With 4 Houses <strong>{money(property.rent.house4 ?? property.rent.base)}</strong></p>
              <p>With HOTEL <strong>{money(property.rent.hotel ?? property.rent.base)}</strong></p>
              <p>Mortgage Value <strong>{money(property.mortgageValue)}</strong></p>
              <p>
                <span>Houses cost</span>
                <span><strong>{money(property.rent.houseCost ?? 0)}</strong> each</span>
              </p>
            </div>
          ) : property.type === "railroad" ? (
            <div className="rent-table">
              <p><strong>Railroad Rent</strong></p>
              <p>If 1 railroad owned <strong>{money(property.rent.base)}</strong></p>
              <p>If 2 railroads owned <strong>{money(property.rent.railroadOwned2 ?? property.rent.base)}</strong></p>
              <p>If 3 railroads owned <strong>{money(property.rent.railroadOwned3 ?? property.rent.base)}</strong></p>
              <p>If 4 railroads owned <strong>{money(property.rent.railroadOwned4 ?? property.rent.base)}</strong></p>
              <p>Mortgage Value <strong>{money(property.mortgageValue)}</strong></p>
            </div>
          ) : (
            <div className="rent-table">
              <p><strong>Utility Rent</strong></p>
              <p>If one utility owned: <strong>{property.rent.utilityOneMultiplier} × dice roll</strong></p>
              <p>If both utilities owned: <strong>{property.rent.utilityBothMultiplier} × dice roll</strong></p>
              <p>Mortgage Value <strong>{money(property.mortgageValue)}</strong></p>
            </div>
          )}
        </div>

        <label>
          Owner
          <select
            value={state.ownerId ?? ""}
            onChange={(event) => setPropertyOwner(property.id, event.target.value || null)}
          >
            <option value="">Unowned</option>
            {session.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Build
          <div className="stepper">
            <button
              className="button button-muted"
              onClick={() => {
                const result = sellHouse(property.id);
                if (!result.ok && result.reason?.includes("exceed 1 house")) {
                  window.alert(result.reason);
                }
              }}
              disabled={!saleEligibility.canSell}
              type="button"
              title={saleEligibility.reason}
            >
              Sell House ({money(Math.floor((property.rent.houseCost ?? 0) / 2))})
            </button>
            <span>{state.hotel ? "Hotel (5)" : `${state.houses} house${state.houses === 1 ? "" : "s"}`}</span>
            {!state.hotel && state.houses < 4 && ownerHasFullSet && (
              <button
                className="button button-muted"
                onClick={() => {
                  const result = buyHouse(property.id);
                  if (!result.ok && result.reason?.includes("exceed lowest by more than 1 house")) {
                    window.alert(result.reason);
                  }
                }}
                disabled={!houseEligibility.canBuy || !canAffordHouse}
                type="button"
                title={houseEligibility.reason ?? (!canAffordHouse ? "Not enough cash" : undefined)}
              >
                Buy House ({money(property.rent.houseCost ?? 0)})
              </button>
            )}
            {!state.hotel && state.houses === 4 && ownerHasFullSet && (
              <button
                className="button button-muted"
                onClick={() => {
                  const result = buyHotel(property.id);
                  if (!result.ok && result.reason?.includes("exceed lowest by more than 1 house")) {
                    window.alert(result.reason);
                  }
                }}
                disabled={!hotelEligibility.canBuy || !canAffordHotel}
                type="button"
                title={hotelEligibility.reason ?? (!canAffordHotel ? "Not enough cash" : undefined)}
              >
                Buy Hotel ({money(property.rent.houseCost ?? 0)})
              </button>
            )}
            {state.hotel && ownerHasFullSet && (
              <button className="button button-muted" type="button" disabled>
                Hotel Bought
              </button>
            )}
          </div>
        </label>
        {property.type === "street" && !ownerHasFullSet && (
          <p className="muted tiny">Own full {property.colorGroup} set to build houses/hotel.</p>
        )}
        {property.type === "street" && ownerHasFullSet && !canBuildHouses && (
          <p className="muted tiny">Build houses only after owning the full color set and when not mortgaged.</p>
        )}

        <div className="stack">
          <p className="muted tiny">
            Mortgage value: {money(property.mortgageValue)} · Unmortgage value: {money(calculateUnmortgageValue(property.mortgageValue))}
          </p>
          <div className="button-row">
            {state.mortgaged ? (
              <button
                className="button"
                type="button"
                onClick={() => {
                  unmortgageProperty(property.id);
                }}
                disabled={!canAffordUnmortgage}
                title={!canAffordUnmortgage ? "Not enough cash to unmortgage" : undefined}
              >
                Unmortgage Property
              </button>
            ) : buildingUnits === 0 ? (
              <button
                className="button"
                type="button"
                onClick={() => {
                  mortgageProperty(property.id);
                }}
              >
                Mortgage Property
              </button>
            ) : null}
          </div>
        </div>

        <Link href="/properties" className="button button-white">Back to Properties</Link>
      </div>
    </section>
  );
}
