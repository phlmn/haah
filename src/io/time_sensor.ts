export function timeSensor(
  handler: (time: Date) => void,
  refreshInterval = 1000,
) {
  setInterval(() => {
    try {
      handler(new Date());
    } catch (e) {
      console.error('Error in timeSensor', e);
    }
  }, refreshInterval);
}
