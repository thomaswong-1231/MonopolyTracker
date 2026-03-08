"use client";

import { useState, useCallback } from "react";

const DICE_FACES: Record<number, string> = {
  1: "⚀",
  2: "⚁",
  3: "⚂",
  4: "⚃",
  5: "⚄",
  6: "⚅",
};

export function DiceRoller() {
  const [open, setOpen] = useState(false);
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);

  const rollDice = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setHasRolled(true);

    let ticks = 0;
    const maxTicks = 10;
    const interval = setInterval(() => {
      setDie1(Math.floor(Math.random() * 6) + 1);
      setDie2(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        setDie1(Math.floor(Math.random() * 6) + 1);
        setDie2(Math.floor(Math.random() * 6) + 1);
        setRolling(false);
      }
    }, 80);
  }, [rolling]);

  const handleOpen = () => {
    setOpen(true);
    setHasRolled(false);
    setDie1(1);
    setDie2(1);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const isDoubles = hasRolled && !rolling && die1 === die2;

  return (
    <>
      <button
        type="button"
        className="dice-header-button"
        onClick={handleOpen}
        aria-label="Roll dice"
        title="Roll dice"
      >
        ⚅
      </button>

      {open && (
        <div className="modal-backdrop" role="presentation" onClick={handleClose}>
          <div
            className="modal dice-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Dice Roller"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <button type="button" className="modal-close-button" onClick={handleClose} aria-label="Close">✕</button>
              <h2>🎲 Dice Roller</h2>
            </div>

            <div className="dice-container">
              <button
                type="button"
                className={`dice-face ${rolling ? "dice-rolling" : ""}`}
                onClick={rollDice}
                disabled={rolling}
                aria-label={`Die 1: ${die1}`}
              >
                {DICE_FACES[die1]}
              </button>
              <button
                type="button"
                className={`dice-face ${rolling ? "dice-rolling" : ""}`}
                onClick={rollDice}
                disabled={rolling}
                aria-label={`Die 2: ${die2}`}
              >
                {DICE_FACES[die2]}
              </button>
            </div>

            {hasRolled && !rolling && (
              <div className="dice-result">
                <p className="dice-total">Total: <strong>{die1 + die2}</strong></p>
                {isDoubles && <p className="dice-doubles">🎉 Doubles!</p>}
              </div>
            )}

            <p className="muted tiny dice-hint">Click the dice to roll</p>
          </div>
        </div>
      )}
    </>
  );
}
