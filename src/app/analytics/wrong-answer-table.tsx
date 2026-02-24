"use client";

import { DifficultyTable } from "./difficulty-table";

/**
 * WrongAnswerTable is an alias for DifficultyTable.
 * Both display the same difficulty/wrong-answer ranking data.
 */
export function WrongAnswerTable() {
  return <DifficultyTable />;
}
