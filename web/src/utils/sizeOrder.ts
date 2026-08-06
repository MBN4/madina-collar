// Converts size labels like "14", "14 1/4", "1/2" into a sortable number.
export function sizeToNumber(sizeString: string): number {
  const str = (sizeString || "").trim();
  const match = str.match(/^(\d+)?\s*(?:(\d+)\/(\d+))?$/);
  if (!match || (!match[1] && !match[2])) {
    return parseFloat(str) || 0;
  }
  const whole = match[1] ? parseInt(match[1], 10) : 0;
  const numerator = match[2] ? parseInt(match[2], 10) : 0;
  const denominator = match[3] ? parseInt(match[3], 10) : 1;
  return whole + numerator / denominator;
}
