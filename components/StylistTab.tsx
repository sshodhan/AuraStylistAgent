
import React, { useState, useEffect, useCallback } from 'react';
import { WeatherData, OutfitSuggestion, TempUnit, AppTab } from '../types';
import { fetchWeather, geocode } from '../services/weatherService';
import { getOutfitSuggestion, generateWeatherHeroImage } from '../services/geminiService';
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
  PartyPopper,
  MapPin,
  ChevronDown,
  Edit2
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
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);

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
      setIsLocationExpanded(false);
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

  useEffect(() => {
    if (!currentOutfit && !weather) {
      handleGenerate();
    }
  }, []);

  const getDisplayTemp = (c: number) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);

  const getWeatherIcon = (precip: number, temp: number) => {
    if (precip > 5) return <CloudLightning className="w-5 h-5 text-yellow-400" />;
    if (precip > 0) return <Droplets className="w-5 h-5 text-blue-400" />;
    if (temp > 20) return <Sun className="w-5 h-5 text-orange-400" />;
    return <CloudIcon className="w-5 h-5 text-white" />;
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Clean Hero Header - Content moved to App Header */}
      <div className="relative w-full aspect-[21/10] bg-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm border border-gray-100 shrink-0">
        {(weatherHero && !loading) ? (
          <>
            <img src={weatherHero} alt="Weather" className="w-full h-full object-cover brightness-[0.8]" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <div className="text-white flex items-end justify-between">
                <div>
                   <p className="text-2xl font-black tracking-tighter leading-none opacity-90 drop-shadow-md">{getDisplayTemp(weather!.temp)}°{unit}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[7px] font-black opacity-70 uppercase tracking-tighter mb-0.5 drop-shadow-sm">Wind</p>
                    <p className="text-[10px] font-black drop-shadow-sm">{weather!.wind}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] font-black opacity-70 uppercase tracking-tighter mb-0.5 drop-shadow-sm">Precip</p>
                    <p className="text-[10px] font-black drop-shadow-sm">{weather!.precip}m</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/20">
                 {getWeatherIcon(weather!.precip, weather!.temp)}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            <p className="text-[8px] font-black uppercase text-indigo-400 mt-1.5 tracking-widest">Atmosphere Sync...</p>
          </div>
        )}
      </div>

      {/* Tighter Style Mood Carousel */}
      <div className="space-y-1.5">
        <h3 className="px-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">What's your vibe?</h3>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x px-1">
          {STYLE_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isActive = context === persona.id;
            return (
              <button
                key={persona.id}
                onClick={() => setContext(persona.id)}
                className={`flex-shrink-0 w-20 h-14 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center snap-center relative ${
                  isActive 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105 z-10' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-50'
                }`}
              >
                <div className={`p-1 rounded-lg mb-0.5 ${isActive ? 'bg-white/20' : 'bg-gray-50'}`}>
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="text-center flex flex-col px-1 leading-none">
                  <span className={`text-[7px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>{persona.name}</span>
                </div>
                {isActive && (
                   <div className="absolute -top-1 -right-1">
                     <div className="bg-white rounded-full p-0.5 shadow-sm border border-indigo-100">
                       <Check className="w-1.5 h-1.5 text-indigo-600 stroke-[5px]" />
                     </div>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="p-2 bg-red-50 text-red-500 rounded-xl text-[8px] font-black uppercase border border-red-100">{error}</div>}

      {/* Compact Verdict Card with Integrated Location Folding */}
      {currentOutfit && weather && (
        <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${loading ? 'opacity-50 grayscale-[0.5]' : 'opacity-100 animate-in slide-in-from-bottom-2'}`}>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">
                  Stylist Verdict
                </span>
                
                {/* Integrated Location Toggle */}
                <div className="relative">
                  {!isLocationExpanded ? (
                    <button 
                      onClick={() => setIsLocationExpanded(true)}
                      className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all active:scale-95 group"
                    >
                      <MapPin className="w-2.5 h-2.5 text-gray-400 group-hover:text-indigo-500" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        {weather.location}
                      </span>
                      <ChevronDown className="w-2.5 h-2.5 text-gray-300" />
                    </button>
                  ) : (
                    <form onSubmit={handleGenerate} className="flex gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-2.5 h-2.5" />
                        <input
                          type="text"
                          autoFocus
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          placeholder="Search..."
                          className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-indigo-100 rounded-lg outline-none text-[10px] font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLocationExpanded(false)}
                        className="p-1.5 bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                      >
                         <ChevronDown className="w-3 h-3 rotate-180" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
              <Sparkles className={`w-4 h-4 text-indigo-500 shrink-0 ${loading ? 'animate-pulse' : ''}`} />
            </div>
            
            <div className="space-y-2 pt-1 border-t border-gray-50 mt-1">
              <OutfitSmallItem label="Core" value={currentOutfit.baseLayer} />
              <OutfitSmallItem label="Shell" value={currentOutfit.outerwear} />
              <OutfitSmallItem label="Step" value={currentOutfit.footwear} />
            </div>

            <div className="pt-2">
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic opacity-80 border-l-2 border-indigo-50 pl-2">
                "{currentOutfit.proTip}"
              </p>
            </div>

            <button
              onClick={() => onTabChange(AppTab.VISUALIZE)}
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-gray-100 disabled:bg-gray-300"
            >
              <Camera className="w-3.5 h-3.5" />
              Visualize Look
            </button>
          </div>

          {outfitImage && (
            <div className="aspect-[3/4] relative group border-t border-gray-50">
              <img src={outfitImage} alt="Visual" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-5 flex justify-end">
                 <a href={outfitImage} download className="p-3 bg-white rounded-xl text-indigo-600 shadow-2xl active:scale-90 transition-all"><Download className="w-5 h-5" /></a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OutfitSmallItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex gap-3 items-start">
    <span className="w-10 text-[7px] font-black text-indigo-300 uppercase mt-0.5 tracking-tighter shrink-0">{label}</span>
    <p className="flex-1 text-[11px] font-black text-gray-900 leading-tight">{value}</p>
  </div>
);

export default StylistTab;
