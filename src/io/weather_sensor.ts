import fetch from 'isomorphic-fetch';

const apiUrl = (apiKey: string, lat: number, lon: number) =>
  `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,hourly&appid=${apiKey}`;
const INTERVAL = 1000 * 60 * 5;

export type WeatherInfo = {
  current: {
    time: Date;
    sunriseTime: Date;
    sunsetTime: Date;
    temperature: number;
    apparentTemperature: number;
    pressure: number;
    humidity: number;
    dewPoint: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    windSpeed: number;
    windGust: number;
    windDegree: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
  };
  today: {
    time: Date;
    sunriseTime: Date;
    sunsetTime: Date;
    moonriseTime: Date;
    moonsetTime: Date;
    moonPhase: number;
    temperature: {
      morning: number;
      day: number;
      evening: number;
      night: number;
      min: number;
      max: number;
    };
    apparentTemperature: {
      morning: number;
      day: number;
      evening: number;
      night: number;
    };
    pressure: number;
    humidity: number;
    dewPoint: number;
    cloudCover: number;
    uvIndex: number;
    windSpeed: number;
    windGust: number;
    windDegree: number;
    precipProbability: number;
    rain: number;
    snow: number;
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    };
  };
};

export function weatherSensor(
  openWeatherMapApiKey: string,
  lat: number,
  lon: number,
  handler: (weatherInfo: WeatherInfo) => void,
) {
  async function updateWeather() {
    try {
      console.info('Updating weather info.');

      const res = await fetch(apiUrl(openWeatherMapApiKey, lat, lon));
      const parsedRes = await res.json();
      const { current } = parsedRes;

      if (!parsedRes.daily) {
        console.error(
          '[weather_sensor] Failed to get weather info. Response:',
          parsedRes,
        );
        return;
      }

      const today = parsedRes.daily[0];

      handler({
        current: {
          time: new Date(current.dt * 1000),
          sunriseTime: new Date(current.sunrise * 1000),
          sunsetTime: new Date(current.sunset * 1000),
          temperature: current.temp,
          apparentTemperature: current.feels_like,
          pressure: current.pressure,
          humidity: current.humidity,
          dewPoint: current.dew_point,
          cloudCover: current.clouds,
          uvIndex: current.uvi,
          visibility: current.visibility,
          windSpeed: current.wind_speed,
          windGust: current.wind_gust,
          windDegree: current.wind_deg,
          weather: {
            id: current.weather.id,
            main: current.weather.main,
            description: current.weather.description,
            icon: current.weather.icon,
          },
        },
        today: {
          time: new Date(today.dt * 1000),
          sunriseTime: new Date(today.sunrise * 1000),
          sunsetTime: new Date(today.sunset * 1000),
          moonriseTime: new Date(today.moonrise * 1000),
          moonsetTime: new Date(today.moonset * 1000),
          moonPhase: today.moon_phase,
          temperature: {
            morning: today.temp.morn,
            day: today.temp.day,
            evening: today.temp.eve,
            night: today.temp.night,
            min: today.temp.min,
            max: today.temp.max,
          },
          apparentTemperature: {
            morning: today.feels_like.morn,
            day: today.feels_like.day,
            evening: today.feels_like.eve,
            night: today.feels_like.night,
          },
          pressure: today.pressure,
          humidity: today.humidity,
          dewPoint: today.dew_point,
          cloudCover: today.clouds,
          uvIndex: today.uvi,
          windSpeed: today.wind_speed,
          windGust: today.wind_gust,
          windDegree: today.wind_deg,
          precipProbability: today.pop,
          rain: today.rain,
          snow: today.snow,
          weather: {
            id: today.weather.id,
            main: today.weather.main,
            description: today.weather.description,
            icon: today.weather.icon,
          },
        },
      });
    } catch (e) {
      console.error('[weather_sensor] Error in weatherSensor', e);
    }
  }

  updateWeather();
  setInterval(updateWeather, INTERVAL);
}
