
import React, { useState, useEffect, useCallback } from 'react';
import { WeatherData, OutfitSuggestion, TempUnit, AppTab } from '../types';
import { fetchWeather, geocode } from '../services/weatherService';
import { getOutfitSuggestion, generateOutfitImage, generateWeatherHeroImage } from '../services/geminiService';
import { 
  Search, 
  Loader2, 
  Sparkles, 
  Camera, 
  Download, 
  RefreshCw, 
  CloudIcon, 
  Sun, 
  CloudLightning, 
  Droplets,
  Shirt,
  Briefcase,
  Footprints,
  Moon,
  Zap,
  Check,
  Coffee,
  Palette,
  BookOpen,
  PartyPopper
} from 'lucide-react';

interface StylePersona {
  id: string;
  name: string;
  label: string;
  icon: React.ElementType;
}

const STYLE_PERSONAS: StylePersona[] = [
  { id: 'casual', name: 'Effortless', label: 'Minimalist', icon: Shirt },
  { id: 'formal office', name: 'Powerful', label: 'Executive', icon: Briefcase },
  { id: 'relaxed home', name: 'Snug', label: 'Cozy', icon: Coffee },
  { id: 'night out', name: 'Chic', label: 'Socialite', icon: Moon },
  { id: 'creative artsy', name: 'Artistic', label: 'Eclectic', icon: Palette },
  { id: 'casual hike', name: 'Rugged', label: 'Explorer', icon: Footprints },
  { id: 'academic studious', name: 'Studious', label: 'Sharp', icon: BookOpen },
  { id: 'athletic', name: 'Active', label: 'Dynamic', icon: Zap },
  { id: 'vibrant party', name: 'Festive', label: 'Energetic', icon: PartyPopper },
];

interface Props {
  unit: TempUnit;
  weather: WeatherData | null;
  weatherHero: string | null;
  outfitImage: string | null;
  onWeatherUpdate: (w: WeatherData) => void;
  onOutfitUpdate: (o: OutfitSuggestion) => void;
  onHeroUpdate: (h: string | null) => void;
  onOutfitImageUpdate: (img: string | null) => void;
  currentOutfit: OutfitSuggestion | null;
  onTabChange: (tab: AppTab) => void;
}

const StylistTab: React.FC<Props> = ({ 
  unit, 
  weather, 
  weatherHero, 
  outfitImage, 
  onWeatherUpdate, 
  onOutfitUpdate, 
  onHeroUpdate,
  onOutfitImageUpdate,
  currentOutfit,
  onTabChange
}) => {
  const [locationInput, setLocationInput] = useState('Seattle');
  const [context, setContext] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    onOutfitImageUpdate(null);
    onHeroUpdate(null);

    try {
      const coords = await geocode(locationInput);
      if (!coords) throw new Error("Could not find location.");

      const weatherData = await fetchWeather(coords.lat, coords.lon, locationInput);
      onWeatherUpdate(weatherData);

      const [suggestion, hero] = await Promise.all([
        getOutfitSuggestion(weatherData, context, unit),
        generateWeatherHeroImage(weatherData, unit).catch(() => null)
      ]);

      onOutfitUpdate(suggestion);
      onHeroUpdate(hero);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSuggestion = useCallback(async (currentWeather: WeatherData, personaId: string) => {
    setLoading(true);
    setError(null);
    onOutfitImageUpdate(null);
    try {
      const suggestion = await getOutfitSuggestion(currentWeather, personaId, unit);
      onOutfitUpdate(suggestion);
    } catch (err: any) {
      setError("Failed to update recommendation.");
    } finally {
      setLoading(false);
    }
  }, [unit, onOutfitUpdate, onOutfitImageUpdate]);

  useEffect(() => {
    if (weather) {
      refreshSuggestion(weather, context);
    }
  }, [context]);

  const handleVisualizeNavigation = () => {
    onTabChange(AppTab.VISUALIZE);
  };

  useEffect(() => {
    if (!currentOutfit && !weather) {
      handleGenerate();
    }
  }, []);

  const getDisplayTemp = (c: number) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);

  const getWeatherIcon = (precip: number, temp: number) => {
    if (precip > 5) return <CloudLightning className="w-6 h-6 text-yellow-400" />;
    if (precip > 0) return <Droplets className="w-6 h-6 text-blue-400" />;
    if (temp > 20) return <Sun className="w-6 h-6 text-orange-400" />;
    return <CloudIcon className="w-6 h-6 text-white" />;
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Climate Header */}
      <div className="relative w-full aspect-[16/8] bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 shrink-0">
        {(weatherHero && !loading) ? (
          <>
            <img src={weatherHero} alt="Weather" className="w-full h-full object-cover brightness-[0.85]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/20">
                  {getWeatherIcon(weather!.precip, weather!.temp)}
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{weather!.location}</span>
                </div>
              </div>
              <div className="text-white flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Current Climate</p>
                  <p className="text-4xl font-black tracking-tighter">{getDisplayTemp(weather!.temp)}°{unit}</p>
                </div>
                <div className="flex gap-3 pb-1">
                  <div className="text-center">
                    <p className="text-[8px] font-black opacity-60 uppercase">Wind</p>
                    <p className="text-xs font-black">{weather!.wind}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black opacity-60 uppercase">Precip</p>
                    <p className="text-xs font-black">{weather!.precip}m</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-widest">Building Forecast...</p>
          </div>
        )}
      </div>

      {/* Style Mood Carousel */}
      <div className="space-y-2">
        <h3 className="px-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">What is your mood today?</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x px-1">
          {STYLE_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isActive = context === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => setContext(persona.id)}
                className={`flex-shrink-0 w-22 h-18 rounded-[1.25rem] border-2 transition-all duration-300 flex flex-col items-center justify-center snap-center relative ${
                  isActive 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105 z-10' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100'
                }`}
              >
                <div className={`p-1 rounded-lg mb-0.5 ${isActive ? 'bg-white/20' : 'bg-gray-50'}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="text-center flex flex-col px-1">
                  <span className={`text-[8px] font-black uppercase tracking-tight leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>{persona.name}</span>
                  <span className={`text-[6px] font-bold uppercase tracking-widest opacity-60 mt-0.5 leading-none ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>{persona.label}</span>
                </div>
                {isActive && (
                   <div className="absolute top-1.5 right-1.5">
                     <div className="bg-white rounded-full p-0.5 shadow-sm">
                       <Check className="w-1.5 h-1.5 text-indigo-600 stroke-[5px]" />
                     </div>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Controls */}
      <div className="bg-white p-2.5 rounded-[1.75rem] shadow-sm border border-gray-100">
        <form onSubmit={handleGenerate} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none text-[11px] font-bold transition-all"
            />
          </div>
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-3.5 rounded-xl disabled:bg-indigo-300 shadow-md shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>

      {error && <div className="p-2 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase border border-red-100 animate-in fade-in">{error}</div>}

      {/* Suggestion Card */}
      {currentOutfit && weather && (
        <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${loading ? 'opacity-50 grayscale-[0.5]' : 'opacity-100 animate-in slide-in-from-bottom-2'}`}>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-[0.2em]">
                {loading ? 'Styling...' : 'The Verdict'}
              </span>
              <Sparkles className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-pulse' : ''}`} />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <OutfitSmallItem label="Core" value={currentOutfit.baseLayer} />
              <OutfitSmallItem label="Shell" value={currentOutfit.outerwear} />
              <OutfitSmallItem label="Step" value={currentOutfit.footwear} />
            </div>

            <div className="pt-4 border-t border-gray-50">
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
                "{currentOutfit.proTip}"
              </p>
            </div>

            <button
              onClick={handleVisualizeNavigation}
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-lg shadow-gray-100 disabled:bg-gray-400"
            >
              <Camera className="w-3.5 h-3.5" />
              Visualize Look
            </button>
          </div>

          {outfitImage && (
            <div className="aspect-[3/4] relative group">
              <img src={outfitImage} alt="Visual" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-6 flex justify-end">
                 <a href={outfitImage} download className="p-3 bg-white rounded-xl text-indigo-600 shadow-2xl active:scale-90 transition-all"><Download className="w-5 h-5" /></a>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="h-6" />
    </div>
  );
};

const OutfitSmallItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex gap-4 items-start">
    <span className="w-12 text-[8px] font-black text-indigo-300 uppercase mt-0.5 tracking-[0.1em] shrink-0">{label}</span>
    <p className="flex-1 text-[13px] font-black text-gray-900 leading-tight">{value}</p>
  </div>
);

export default StylistTab;
