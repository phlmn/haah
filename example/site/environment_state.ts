import { state, updateState, timeSensor, weatherSensor } from 'haah';

import { openWeatherMapApiKey, location } from '../secrets';
import { isTimeBetween } from '../util/time';

export const environmentState = state('time', {
  time: new Date(),
  weather: null,
});

timeSensor((time) => {
  updateState(environmentState, (environmentState) => {
    environmentState.time = time;
  });
});

weatherSensor(openWeatherMapApiKey, location.lat, location.long, (weather) => {
  updateState(environmentState, (environmentState) => {
    environmentState.weather = weather;
  });
});

export function isDaylight() {
  return isTimeBetween(
    environmentState.weather.today.sunriseTime,
    environmentState.weather.today.sunsetTime,
    environmentState.time,
  );
}
