function clampChannel(n: number): number {
  return Math.min(255, Math.max(0, n));
}

function hex2(c: number): string {
  return c.toString(16).padStart(2, '0');
}

/** Clamp each channel to 0..255 and format as lowercase #rrggbb. */
export function rgb_to_hex(r: number, g: number, b: number): string {
  return '#' + hex2(clampChannel(r)) + hex2(clampChannel(g)) + hex2(clampChannel(b));
}
