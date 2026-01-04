
import { WeatherData } from '../types';

export const fetchWeather = async (lat: number, lon: number, locationName: string): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`;
  const response = await fetch(url);
  const data = await response.json();
  const current = data.current;

  return {
    temp: current.temperature_2m,
    precip: current.precipitation,
    wind: current.wind_speed_10m,
    location: locationName,
    coords: { lat, lon }
  };
};

export const geocode = async (location: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude
      };
    }
  } catch (error) {
    console.error("Geocoding failed", error);
  }
  return null;
};
