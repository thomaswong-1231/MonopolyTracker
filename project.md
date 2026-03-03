# Monopoly Game Tracker — Product Requirements Document 
**Version:** 1.0 (MVP Simple)  
**Last Updated:** 2026-03-03  
**Platforms:** Web (mobile-first, responsive)  
**Primary Mode:** One-device “Banker” control (shared screen)

---

## 1. Overview
Monopoly Game Tracker is a lightweight web app that replaces paper money and handwritten notes by tracking:
- **Players**
- **Cash balances**
- **Property ownership**
- **Basic property state** (houses/hotel/mortgage)
- **Transaction history** (audit trail)

**Default starting cash must be $1500**, matching standard Monopoly rules. Starting cash is editable per game.

---

## 2. Goals and Non-Goals

### 2.1 Goals (MVP Simple)
- Create a game session quickly.
- Add/edit/remove players.
- Automatically initialize each player’s cash to the game’s starting cash (default **$1500**).
- Record cash transactions:
  - Player → Bank
  - Bank → Player
  - Player → Player
- Assign properties to players (or mark unowned).
- Manually adjust houses/hotel/mortgage on properties.
- Provide a clear dashboard with balances and simple net worth.
- Maintain an audit trail of all actions with an **Undo Last Action**.

### 2.2 Non-Goals (Out of Scope for MVP)
- Automatic rent calculations or rule enforcement (beyond minimal consistency rules in property state).
- Turn tracking.
- Chance/Community Chest simulation.
- Bundled trades (cash + multiple properties in one action).
- Authentication / user accounts.
- Multi-device real-time sync (optional future enhancement).
- Advanced analytics and exports.

---

## 3. Target Users
- Casual Monopoly groups (2–10 players).
- A designated “banker” who inputs actions quickly on a phone/tablet/laptop.

---

## 4. Success Metrics (MVP)
- A standard cash transaction can be recorded in **≤ 5 seconds** on mobile.
- Create game + add 4 players in **≤ 60 seconds**.
- Common actions reachable in **≤ 2 taps/clicks** from the dashboard.
- Users can resolve disputes using history without ambiguity.

---

## 5. Assumptions and Constraints
- Currency is USD; amounts are whole dollars (integers) for MVP.
- Bank has infinite money (no bank balance tracked).
- Cash balances may go negative (with a warning).
- Monopoly board data is preloaded (classic set) and available offline once loaded.
- MVP supports a single controlling device; persistence must survive page refresh.

---

## 6. Roles and Permissions (MVP)
### 6.1 Banker/Host
- Full control of all actions:
  - Manage players
  - Record transactions
  - Assign properties
  - Modify property state
  - Undo last action
  - Reset game

### 6.2 Viewer (Optional)
- Read-only mode may be omitted in MVP. If included, it must be explicit and safe (no write actions).

---

## 7. Core User Flows

### 7.1 Create Game
**Steps**
1. User selects **Create Game**.
2. Enters:
   - Game name (required)
   - Starting cash (default **1500**, required, integer)
3. Proceeds to player setup.

**Acceptance Criteria**
- Starting cash field is pre-filled with **1500**.
- Validation prevents starting with empty name or invalid starting cash.

---

### 7.2 Add Players
**Steps**
1. User selects **Add Player**.
2. Enters:
   - Name (required)
   - Color (required; pick from preset palette)
   - Optional icon/avatar (may be a simple initial or default token)
3. Player is created with cash = starting cash.

**Acceptance Criteria**
- Player cash initializes to starting cash.
- Supports 2–10 players.
- Duplicate names are allowed but show a subtle warning indicator.

---

### 7.3 Record Cash Transaction
All cash movements are recorded via a single quick modal from the dashboard.

**Transaction Types**
- **Player → Bank**
- **Bank → Player**
- **Player → Player**

**Required Fields**
- Type
- Amount (integer, > 0)
- From/To selection where applicable
- Optional note (max 140 characters)

**Acceptance Criteria**
- Saving updates balances immediately and adds a history entry.
- Prevent save if amount is missing, non-integer, or ≤ 0.
- If payer balance becomes negative:
  - Allow the transaction
  - Display a warning before saving (or a clear warning after saving)

---

### 7.4 Assign Property Ownership
**Steps**
1. User navigates to **Properties** view.
2. Selects a property.
3. Sets owner to:
   - Unowned, or
   - One of the players

**Acceptance Criteria**
- Property ownership updates immediately.
- Reassigning removes the property from the previous owner correctly.
- Ownership changes create a history entry (non-cash event).

---

### 7.5 Update Property State (Manual)
Within property details:
- Houses: stepper (0–4)
- Hotel: toggle
- Mortgaged: toggle

**Consistency Rules (MVP Minimal)**
- If Hotel is enabled, Houses must be set to 0 automatically.
- Houses cannot exceed 4.
- If Houses > 0, Hotel must be false automatically.

**Acceptance Criteria**
- Property state updates immediately.
- Change creates a history entry.

---

### 7.6 View History and Undo Last Action
**History View**
- Reverse chronological list of all events:
  - Timestamp
  - Event type
  - Participants (from/to) where relevant
  - Amount (for cash events)
  - Note (if present)

**Undo**
- Host can undo **only the most recent** event.

**Acceptance Criteria**
- Undo restores the exact previous state.
- Undo button is disabled if there is no history.

---

## 8. Functional Requirements

### 8.1 Pages / Screens
1. **Home**
   - Create Game
   - (Optional) Resume Last Game (only if persistence exists)
2. **Setup**
   - Game name
   - Starting cash
   - Player list (add/edit/remove)
   - Start Game
3. **Dashboard**
   - Player cards:
     - Name + color token
     - Cash balance
     - Net worth (see 8.4)
     - Quick actions: Pay, Receive, Transfer
   - Navigation to:
     - Properties
     - History
     - Settings
4. **Properties**
   - Grouped display:
     - By color group for streets
     - Separate sections for railroads and utilities
   - Each property row shows:
     - Name
     - Owner badge (or Unowned)
     - Indicators for houses/hotel/mortgage
5. **Property Detail**
   - Owner picker
   - Houses stepper
   - Hotel toggle
   - Mortgaged toggle
6. **History**
   - Event list
   - Undo last action
7. **Settings**
   - Reset game (clear stored state)
   - Edit starting cash (optional; if edited mid-game, must not retroactively change existing balances)

---

### 8.2 Preloaded Monopoly Dataset
The app must ship with a built-in Monopoly property dataset (classic set) containing at minimum:
- Property id
- Property name
- Type (street/railroad/utility)
- Color group (for streets)
- Purchase price
- Mortgage value

**Notes**
- Rent tables may be included as placeholders but are not required for MVP behavior.

**Acceptance Criteria**
- All properties appear in the Properties view.
- Ownership can be assigned for every property.

---

### 8.3 Persistence (MVP Requirement)
State must persist across refresh and accidental tab close.

**Implementation Requirement**
- Use a simple persistence mechanism (e.g., browser storage) to load/save the current game.

**Acceptance Criteria**
- Refresh returns to the current game state.
- Reset clears the stored state and returns to Home.

---

### 8.4 Net Worth Calculation (MVP Simple)
Net worth is computed as:
- **Cash balance + sum(purchase price of owned properties)**

Ignore houses/hotel costs and mortgages in MVP net worth.

**Acceptance Criteria**
- Net worth updates immediately on:
  - Cash changes
  - Property ownership changes

---

### 8.5 Player Management
**Edit Player**
- Edit name and color.
- Editing does not change cash.

**Remove Player**
- Removing a player must:
  - Reassign their properties to Unowned automatically.
  - Record a history entry (either one grouped event or per property; grouped preferred).

**Acceptance Criteria**
- Removing a player does not crash state.
- Properties do not remain “owned by a deleted id”.

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Dashboard interactions should feel instantaneous on mobile devices.
- Properties list should render without noticeable lag.

### 9.2 Accessibility
- Tap targets ≥ 44px.
- Keyboard navigation for modals.
- Clear contrast for text and indicators.

### 9.3 Reliability
- All updates must be atomic from the user’s perspective.
- The app should not lose data on refresh (assuming storage is available).

### 9.4 Responsive Design
- Mobile-first layout.
- Must work well at 390px width and scale to desktop.

---

## 10. UI and Interaction Requirements

### 10.1 Design Principles
- Minimal friction: common actions in 1–2 interactions.
- Player identity: color token consistently shown.
- Clean look: card-based layout with restrained accents.

### 10.2 Components (Must Have)
- Player card grid
- Transaction modal (single modal supports all 3 transaction types)
- Property list grouped by category
- Property detail panel/page
- History list
- Toast/snackbar feedback (e.g., “Transaction saved”, “Undone”)

### 10.3 Input UX Requirements
- Amount field:
  - Numeric only
  - Reject decimals in MVP
- Quick-select participants:
  - From/to pickers should be fast (dropdown or list)

---

## 11. Error Handling
- Inline validation errors for missing/invalid inputs.
- If persistence fails (storage unavailable), show a banner:
  - “Unable to save locally. Your changes may be lost.”
- Confirm destructive actions:
  - Reset game
  - Remove player

---

## 12. Edge Cases
- Duplicate player names: allowed, but internal operations must use unique ids.
- Negative balances: permitted, but visually indicated.
- Property reassignment: must remove from previous owner cleanly.
- Undo after multiple types of events: must restore exact prior state.
- Editing starting cash mid-game (if allowed): must not retroactively affect players.

---

## 13. Acceptance Test Checklist (MVP)
- [ ] Creating a game defaults starting cash to **1500**.
- [ ] Adding players sets each player cash to starting cash.
- [ ] Player → Bank transaction reduces player cash and appears in history.
- [ ] Bank → Player transaction increases player cash and appears in history.
- [ ] Player → Player transaction moves cash correctly and appears in history.
- [ ] Properties can be assigned to players and reflect ownership everywhere.
- [ ] Net worth updates after cash or property changes.
- [ ] Hotel/houses consistency rules are enforced.
- [ ] History shows newest events first with clear details.
- [ ] Undo restores the exact previous state for the last event.
- [ ] Refresh persists the game state.
- [ ] Reset clears state and returns to Home.

---

## 14. Future Enhancements (Post-MVP)
- Multi-device live sync with join link/QR code
- Automatic rent calculations and rule enforcement
- Trades bundle (cash + properties in one transaction)
- Export history (CSV)
- Accounts/authentication
- Dark mode
- Turn tracker and timer