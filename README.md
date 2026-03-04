# Monopoly Tracker

A Next.js (App Router) + TypeScript web app to track Monopoly games: players, cash, properties, rents, trades, mortgages, houses/hotels, and history.

## Features
- Create and manage multiple games
- Player dashboard with cash + net worth
- Property ownership, rents, houses/hotels, mortgage/unmortgage
- Cash transactions (bank/player/player)
- Multi-property trading
- History + undo
- Local persistence in browser storage

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- React
- CSS (global styles)

## Run Locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Build
```bash
npm run build
npm start
```

## Notes
- Data is stored in `localStorage` (browser-based, per device/browser).
