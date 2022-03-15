import { clearInterval } from "timers";
import { registerCleanup } from "../modules";

export function timeSensor(
  handler: (time: Date) => void,
  refreshInterval = 1000,
) {
  const interval = setInterval(() => {
    try {
      handler(new Date());
    } catch (e) {
      console.error('Error in timeSensor', e);
    }
  }, refreshInterval);

  registerCleanup(() => {
    clearInterval(interval);
  });
}
