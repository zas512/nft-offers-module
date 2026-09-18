import type { ITimestamps } from "../types/index.js";

export function createTimestamps(): ITimestamps {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now
  };
}

export function getCurrentTimestamp(): Date {
  return new Date();
}
