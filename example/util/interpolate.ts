export function interpolate(value: number, state0: any, state1: any): any {
  if (typeof state0 === 'number') {
    return Math.round(state0 * (1 - value) + state1 * value);
  }
  return Object.fromEntries(
    Object.keys(state0).map((k) => [
      k, interpolate(value, state0[k], state1[k]),
    ]),
  );
}
