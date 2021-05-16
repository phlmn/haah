import fetch from 'isomorphic-fetch';

const apiUrl = (apiKey: string, lat: number, long: number) =>
  `https://api.darksky.net/forecast/${apiKey}/${lat},${long}?units=si`;
const INTERVAL = 1000 * 60 * 5;

export type WeatherInfo = {
  current: {
    time: Date;
    summary: string;
    precipIntensity: number;
    precipProbability: number;
    precipType: string;
    temperature: number;
    apparentTemperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    ozone: number;
  };
  today: {
    time: Date;
    summary: string;
    sunriseTime: Date;
    sunsetTime: Date;
    moonPhase: number;
    precipIntensity: number;
    precipIntensityMax: number;
    precipIntensityMaxTime: number;
    precipProbability: number;
    precipAccumulation: number;
    precipType: string;
    temperatureHigh: number;
    temperatureHighTime: Date;
    temperatureLow: number;
    temperatureLowTime: Date;
    apparentTemperatureHigh: number;
    apparentTemperatureHighTime: Date;
    apparentTemperatureLow: number;
    apparentTemperatureLowTime: Date;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    uvIndexTime: Date;
    visibility: number;
    temperatureMin: number;
    temperatureMinTime: Date;
    temperatureMax: number;
    temperatureMaxTime: Date;
    apparentTemperatureMin: number;
    apparentTemperatureMinTime: Date;
    apparentTemperatureMax: number;
    apparentTemperatureMaxTime: Date;
  };
};

export default function weatherSensor(
  darkSkyApiKey: string,
  lat: number,
  long: number,
  handler: (weatherInfo: WeatherInfo) => void,
) {
  async function updateWeather() {
    try {
      console.info('Updating weather info.');

      const res = await fetch(apiUrl(darkSkyApiKey, lat, long));
      const parsedRes = await res.json();
      const { currently } = parsedRes;

      const today = parsedRes.daily.data[0];

      handler({
        current: {
          time: new Date(currently.time * 1000),
          summary: currently.summary,
          precipIntensity: currently.precipIntensity,
          precipProbability: currently.precipProbability,
          precipType: currently.precipType,
          temperature: currently.temperature,
          apparentTemperature: currently.apparentTemperature,
          dewPoint: currently.dewPoint,
          humidity: currently.humidity,
          pressure: currently.pressure,
          windSpeed: currently.windSpeed,
          windGust: currently.windGust,
          windBearing: currently.windBearing,
          cloudCover: currently.cloudCover,
          uvIndex: currently.uvIndex,
          visibility: currently.visibility,
          ozone: currently.ozone,
        },
        today: {
          time: new Date(today.time * 1000),
          summary: today.summary,
          sunriseTime: new Date(today.sunriseTime * 1000),
          sunsetTime: new Date(today.sunsetTime * 1000),
          moonPhase: today.moonPhase,
          precipIntensity: today.precipIntensity,
          precipIntensityMax: today.precipIntensityMax,
          precipIntensityMaxTime: today.precipIntensityMaxTime,
          precipProbability: today.precipProbability,
          precipAccumulation: today.precipAccumulation,
          precipType: today.precipType,
          temperatureHigh: today.temperatureHigh,
          temperatureHighTime: new Date(today.temperatureHighTime * 1000),
          temperatureLow: today.temperatureLow,
          temperatureLowTime: new Date(today.temperatureLowTime * 1000),
          apparentTemperatureHigh: today.apparentTemperatureHigh,
          apparentTemperatureHighTime: new Date(
            today.apparentTemperatureHighTime * 1000,
          ),
          apparentTemperatureLow: today.apparentTemperatureLow,
          apparentTemperatureLowTime: new Date(
            today.apparentTemperatureLowTime * 1000,
          ),
          dewPoint: today.dewPoint,
          humidity: today.humidity,
          pressure: today.pressure,
          windSpeed: today.windSpeed,
          windBearing: today.windBearing,
          cloudCover: today.cloudCover,
          uvIndex: today.uvIndex,
          uvIndexTime: new Date(today.uvIndexTime * 1000),
          visibility: today.visibility,
          temperatureMin: today.temperatureMin,
          temperatureMinTime: new Date(today.temperatureMinTime * 1000),
          temperatureMax: today.temperatureMax,
          temperatureMaxTime: new Date(today.temperatureMaxTime * 1000),
          apparentTemperatureMin: today.apparentTemperatureMin,
          apparentTemperatureMinTime: new Date(
            today.apparentTemperatureMinTime * 1000,
          ),
          apparentTemperatureMax: today.apparentTemperatureMax,
          apparentTemperatureMaxTime: new Date(
            today.apparentTemperatureMaxTime * 1000,
          ),
        },
      });
    } catch (e) {
      console.error('Error in weatherSensor', e);
    }
  }

  updateWeather();
  setInterval(updateWeather, INTERVAL);
}
