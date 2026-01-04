
export type TempUnit = 'C' | 'F';

export interface WeatherData {
  temp: number; // Stored in Celsius
  precip: number;
  wind: number;
  location: string;
  coords?: { lat: number; lon: number };
}

export interface OutfitSuggestion {
  baseLayer: string;
  outerwear: string;
  footwear: string;
  proTip: string;
  styleReasoning: string;
  // New Lifestyle Fields
  activity: string;
  coffeeSpot: string;
  storeType: string;
}

export enum AppTab {
  STYLIST = 'stylist',
  VOICE = 'voice',
  VISUALIZE = 'visualize',
  PLAN = 'plan',
  SETTINGS = 'settings'
}

export interface GroundingLink {
  uri: string;
  title: string;
  coords?: { lat: number; lon: number };
  type?: 'eat' | 'explore' | 'shop';
}
