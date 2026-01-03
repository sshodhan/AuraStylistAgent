
export type TempUnit = 'C' | 'F';

export interface WeatherData {
  temp: number; // Stored in Celsius
  precip: number;
  wind: number;
  location: string;
}

export interface OutfitSuggestion {
  baseLayer: string;
  outerwear: string;
  footwear: string;
  proTip: string;
  styleReasoning: string;
}

export enum AppTab {
  STYLIST = 'stylist',
  VOICE = 'voice',
  VISUALIZE = 'visualize',
  STORES = 'stores',
  SETTINGS = 'settings'
}

export interface GroundingLink {
  uri: string;
  title: string;
}
