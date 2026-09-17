export function createTimestamps() {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now
  };
}

export function getCurrentTimestamp() {
  return new Date();
}
