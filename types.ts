
export type TempUnit = 'C' | 'F';
export type VideoResolution = '720p' | '1080p';
export type ImageResolution = '1K' | '2K' | '4K';

export interface UserProfile {
  name: string;
  email: string;
  gender: string;
  ageRange: string;
  styleArchetype: string; 
  preferredPalette: string[]; 
  bodyType?: string;
  seasonalVibe?: string;
}

export interface WeatherData {
  temp: number;
  precip: number;
  wind: number;
  location: string;
  coords?: { lat: number; lon: number };
}

export interface OutfitSuggestion {
  baseLayer: string;
  outerwear: string;
  lowerBody: string; 
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
