
export type TempUnit = 'C' | 'F';

export interface UserProfile {
  name: string;
  email: string;
  styleArchetype: string; // e.g., "Dark Academia", "Minimalist Tech", "Vintage Boho"
  preferredPalette: string[]; // e.g., ["#2D3436", "#636E72"]
  bodyType?: string;
  seasonalVibe?: string;
}

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
  lowerBody: string; // NEW: Mandatory field to prevent "no pants" rendering errors
  footwear: string;
  proTip: string;
  styleReasoning: string;
  weatherStory: string;
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
  reason?: string;
  coords?: { lat: number; lon: number };
  type?: 'eat' | 'explore' | 'shop';
}
