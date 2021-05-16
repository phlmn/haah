export function isTimeBetween(
  from: Date | string,
  to: Date | string,
  time: Date | string,
) {
  from = new Date(from);
  to = new Date(to);
  time = new Date(time);

  return from < time && time < to;
}
