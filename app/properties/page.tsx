"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { COLOR_GROUP_COLORS, COLOR_GROUP_ORDER, MONOPOLY_PROPERTIES } from "@/lib/monopolyData";
import { getCurrentRentDisplay, getFullSetRentDisplay } from "@/lib/propertyRules";
import { money, useGame } from "@/lib/gameStore";

export default function PropertiesPage() {
  const router = useRouter();
  const { session } = useGame();

  if (!session) {
    return (
      <section className="card stack">
        <h1>No active game</h1>
        <button className="button" onClick={() => router.push("/")}>Go Home</button>
      </section>
    );
  }

  const streetGroups = COLOR_GROUP_ORDER.map((group) => ({
    group,
    color: COLOR_GROUP_COLORS[group],
    items: MONOPOLY_PROPERTIES.filter((property) => property.type === "street" && property.colorGroup === group)
  })).filter((section) => section.items.length > 0);

  const railroads = MONOPOLY_PROPERTIES.filter((property) => property.type === "railroad");
  const utilities = MONOPOLY_PROPERTIES.filter((property) => property.type === "utility");

  const renderPropertyRow = (propertyId: string) => {
    const property = MONOPOLY_PROPERTIES.find((item) => item.id === propertyId);
    if (!property) return null;

    const state = session.properties[property.id];
    const owner = session.players.find((player) => player.id === state?.ownerId);

    return (
      <Link key={property.id} href={`/properties/${property.id}`} className="property-row property-row-fancy">
        <span className="property-color-bar" style={{ backgroundColor: COLOR_GROUP_COLORS[property.colorGroup] ?? "#94a3b8" }} />
        <div className="property-main">
          <div className="property-topline">
            <strong>{property.name}</strong>
            <span className="badge">{owner ? owner.name : "Unowned"}</span>
          </div>
          <div className="property-meta">
            <span className="muted tiny">Current rent: {getCurrentRentDisplay(session, property.id)}</span>
            <span className="muted tiny">Full set rent: {getFullSetRentDisplay(property)}</span>
            {!owner && <span className="muted tiny property-price-line">Price: {money(property.purchasePrice)}</span>}
            {property.type === "street" && (
              <span className="muted tiny">
                Base {money(property.rent.base)} · H:{state.houses} {state.hotel ? "| Hotel" : ""} {state.mortgaged ? "| Mortgaged" : ""}
              </span>
            )}
            {property.type !== "street" && (
              <span className="muted tiny">Mortgaged: {state.mortgaged ? "Yes" : "No"}</span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="stack">
      <h1>Properties</h1>

      {streetGroups.map((section) => (
        <div key={section.group} className="card stack group-card">
          <h2 className="group-title">
            <span className="color-pill" style={{ backgroundColor: section.color }} aria-hidden />
            {section.group}
          </h2>
          <div className="property-cards-grid">
            {section.items.map((property) => renderPropertyRow(property.id))}
          </div>
        </div>
      ))}

      <div className="card stack group-card">
        <h2 className="group-title">
          <span className="color-pill" style={{ backgroundColor: COLOR_GROUP_COLORS.Railroad }} aria-hidden />
          Railroads
        </h2>
        <div className="property-cards-grid">
          {railroads.map((property) => renderPropertyRow(property.id))}
        </div>
      </div>

      <div className="card stack group-card">
        <h2 className="group-title">
          <span className="color-pill" style={{ backgroundColor: COLOR_GROUP_COLORS.Utility }} aria-hidden />
          Utilities
        </h2>
        <div className="property-cards-grid">
          {utilities.map((property) => renderPropertyRow(property.id))}
        </div>
      </div>
    </section>
  );
}
