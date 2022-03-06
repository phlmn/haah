export function interpolate(value: number, state0: any, state1: any): any {
  if (typeof state0 === 'number') {
    return clamp(Math.round(state0 * (1 - value) + state1 * value), state0, state1);
  }
  return Object.fromEntries(
    Object.keys(state0).map((k) => [
      k, interpolate(value, state0[k], state1[k]),
    ]),
  );
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    const temp = min;
    min = max;
    max = temp;
  }
  return Math.max(min, Math.min(max, value))
}