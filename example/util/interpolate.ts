export function interpolate(value: number, state0: any, state1: any): any {
  return Object.fromEntries(
    Object.keys(state0).map((k) => [
      k,
      typeof state0[k] === 'number'
        ? Math.round(state0[k] * (1 - value) + state1[k] * value)
        : interpolate(value, state0[k], state1[k]),
    ]),
  );
}
