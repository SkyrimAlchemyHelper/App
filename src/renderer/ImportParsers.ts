export function parseIntFromLog(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw new Error('Invalid data in log file');
  }

  return parsed;
}

export function parseFloatFromLog(raw: string): number {
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    throw new Error('Invalid data in log file');
  }

  return parsed;
}

export function parseBooleanFromLog(raw: string): boolean {
  switch (raw.toLowerCase()) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      throw new Error('Invalid data in log file');
  }
}
