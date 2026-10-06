export const TOTAL_POINTS = 100;
export const MAX_PER_QUESTION = 90; // 90 x 2 + 10 = 190 maximaal

// mode: "normal" | "leverage" | "hedge"
// normal:   goed = +inzet, fout = 0
// leverage: goed = +2x inzet, fout = -inzet
// hedge:    altijd de helft van de inzet, goed of fout
export function scoreQuestion({ wager, correct, mode }) {
  if (mode === "leverage") return correct ? wager * 2 : -wager;
  if (mode === "hedge") return Math.round(wager / 2);
  return correct ? wager : 0;
}
