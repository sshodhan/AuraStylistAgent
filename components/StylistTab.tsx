
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherData, OutfitSuggestion, TempUnit, AppTab } from '../types';
import { fetchWeather, geocode, reverseGeocode } from '../services/weatherService';
import { getOutfitSuggestion, generateWeatherHeroImage } from '../services/geminiService';
import { 
  Search, 
  Loader2, 
  Sparkles, 
  Camera, 
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
  X, 
  Pencil, 
  Compass, 
  Store, 
  ArrowRight, 
  Navigation, 
  Cloud, 
  AlertCircle,
  Wind,
  Thermometer,
  CloudRain
} from 'lucide-react';

interface StylePersona {
  id: string;
  name: string;
  label: string;
  icon: React.ElementType;
  emoji: string;
  color: string;
  bgColor: string;
}

const STYLE_PERSONAS: StylePersona[] = [
  { id: 'casual', name: 'Effortless', label: 'Minimalist', icon: Shirt, emoji: '👕', color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50' },
  { id: 'formal office', name: 'Powerful', label: 'Executive', icon: Briefcase, emoji: '💼', color: 'from-slate-700 to-slate-900', bgColor: 'bg-slate-100' },
  { id: 'relaxed home', name: 'Snug', label: 'Cozy', icon: Coffee, emoji: '☕', color: 'from-orange-400 to-amber-600', bgColor: 'bg-orange-50' },
  { id: 'night out', name: 'Chic', label: 'Socialite', icon: Moon, emoji: '🌙', color: 'from-indigo-600 to-purple-600', bgColor: 'bg-indigo-50' },
  { id: 'creative artsy', name: 'Artistic', label: 'Eclectic', icon: Palette, emoji: '🎨', color: 'from-pink-500 to-rose-400', bgColor: 'bg-rose-50' },
  { id: 'casual hike', name: 'Rugged', label: 'Explorer', icon: Footprints, emoji: '🥾', color: 'from-emerald-500 to-teal-400', bgColor: 'bg-emerald-50' },
  { id: 'academic studious', name: 'Studious', label: 'Sharp', icon: BookOpen, emoji: '📚', color: 'from-amber-700 to-yellow-800', bgColor: 'bg-stone-100' },
  { id: 'athletic', name: 'Active', label: 'Dynamic', icon: Zap, emoji: '⚡', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50' },
  { id: 'vibrant party', name: 'Festive', label: 'Energetic', icon: PartyPopper, emoji: '🥳', color: 'from-fuchsia-500 to-purple-500', bgColor: 'bg-fuchsia-50' },
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
  onFitCheck?: () => void;
  styleContext: string;
  onStyleContextUpdate: (context: string) => void;
}

interface CitySuggestion {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
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
  onTabChange,
  onFitCheck,
  styleContext,
  onStyleContextUpdate
}) => {
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const activePersona = STYLE_PERSONAS.find(p => p.id === styleContext) || STYLE_PERSONAS[0];

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
      const data = await response.json();
      setSuggestions(data.results || []);
    } catch (err) {
      console.error("Geocoding fetch failed", err);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationInput(val);
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => fetchSuggestions(val), 400);
  };

  const selectCity = async (city: CitySuggestion) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setLocationInput(city.name);
    onOutfitImageUpdate(null);
    onHeroUpdate(null);
    try {
      const weatherData = await fetchWeather(city.latitude, city.longitude, city.name);
      onWeatherUpdate(weatherData);
      const [suggestion, hero] = await Promise.all([
        getOutfitSuggestion(weatherData, styleContext, unit),
        generateWeatherHeroImage(weatherData, unit).catch(() => null)
      ]);
      onOutfitUpdate(suggestion);
      onHeroUpdate(hero);
      setIsLocationExpanded(false);
    } catch (err: any) {
      setError("Atmospheric sync failed. Try a different city.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput) return;
    setLoading(true);
    setError(null);
    const query = locationInput;
    setSuggestions([]); 
    try {
      const coords = await geocode(query);
      if (!coords) throw new Error("City not found");
      const weatherData = await fetchWeather(coords.lat, coords.lon, query);
      onWeatherUpdate(weatherData);
      const [suggestion, hero] = await Promise.all([
        getOutfitSuggestion(weatherData, styleContext, unit),
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

  const handleDetectLocation = () => {
    setIsLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const cityName = await reverseGeocode(latitude, longitude);
          setLocationInput(cityName);
          const weatherData = await fetchWeather(latitude, longitude, cityName);
          onWeatherUpdate(weatherData);
          const [suggestion, hero] = await Promise.all([
            getOutfitSuggestion(weatherData, styleContext, unit),
            generateWeatherHeroImage(weatherData, unit).catch(() => null)
          ]);
          onOutfitUpdate(suggestion);
          onHeroUpdate(hero);
        } catch (err) {
          setError("Failed to sync localized weather.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setError("Location access denied.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const refreshSuggestion = useCallback(async (currentWeather: WeatherData, personaId: string) => {
    setLoading(true);
    onOutfitImageUpdate(null);
    try {
      const suggestion = await getOutfitSuggestion(currentWeather, personaId, unit);
      onOutfitUpdate(suggestion);
    } catch (err: any) {
      setError("Style refresh failed.");
    } finally {
      setLoading(false);
    }
  }, [unit, onOutfitUpdate, onOutfitImageUpdate]);

  const handlePersonaClick = (id: string) => {
    onStyleContextUpdate(id);
    if (weather) refreshSuggestion(weather, id);
  };

  const getDisplayTemp = (c: number) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);

  const SuggestionsDropdown = () => (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden z-[200]"
        >
          {suggestions.map((city, idx) => (
            <button key={idx} type="button" onClick={() => selectCity(city)} 
              className="w-full px-6 py-4 text-left hover:bg-indigo-50 text-[11px] font-black text-gray-950 uppercase tracking-tight border-b last:border-0 border-gray-50 flex justify-between items-center transition-colors"
            >
              <span>{city.name}, {city.country}</span>
              <ArrowRight className="w-3 h-3 text-indigo-400" />
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Onboarding View
  if (!weather && !loading && !isLocating) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-100">
            <Cloud className="text-white w-12 h-12" />
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-2 -right-2 bg-indigo-400 w-6 h-6 rounded-full blur-xl"
          />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Welcome to Aura</h1>
          <p className="text-sm text-gray-400 font-medium px-8 leading-relaxed">Connect your environment to unlock professional styling verdicts.</p>
        </div>
        <div className="w-full space-y-4 pt-4">
          <button onClick={handleDetectLocation} disabled={isLocating}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 fill-white" />}
            {isLocating ? "Syncing GPS..." : "Near Me"}
          </button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
          <form onSubmit={handleManualSearch} className="relative z-[100]">
            <input type="text" value={locationInput} onChange={handleInputChange} placeholder="Search City..."
              className="w-full bg-white border-2 border-indigo-50 rounded-[2rem] px-6 py-4 text-sm font-black text-gray-950 placeholder:text-gray-300 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-200 transition-all shadow-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-gray-900 text-white rounded-2xl active:scale-90 transition-all">
              <Search className="w-4 h-4" />
            </button>
            <SuggestionsDropdown />
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden">
      {/* Visual Hero Card */}
      <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-[1.75rem] overflow-hidden shadow-sm border border-gray-100 shrink-0">
        {(weatherHero && !loading && !isLocating) ? (
          <>
            <img src={weatherHero} alt="Weather" className="w-full h-full object-cover brightness-[0.8]" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
              <div className="text-white flex items-end justify-between">
                <p className="text-2xl font-black tracking-tighter leading-none opacity-90">{getDisplayTemp(weather!.temp)}°{unit}</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3 h-3 opacity-60" />
                    <p className="text-[10px] font-black">{weather!.wind}k</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CloudRain className="w-3 h-3 opacity-60" />
                    <p className="text-[10px] font-black">{weather!.precip}m</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-3">Atmosphere Sync...</p>
          </div>
        )}
      </div>

      {/* Mood Carousel */}
      <div className="space-y-4 pt-1 relative overflow-hidden">
        <h3 className="px-5 text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Style Persona</h3>
        <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide px-5 snap-x">
          {STYLE_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isActive = styleContext === persona.id;
            return (
              <motion.div key={persona.id} className="flex-shrink-0 snap-center">
                <button onClick={() => handlePersonaClick(persona.id)}
                  className={`relative w-24 h-24 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive ? `bg-gradient-to-br ${persona.color} border-transparent text-white shadow-xl scale-105 z-10` : `${persona.bgColor} border-gray-100 text-gray-400 hover:border-indigo-200`
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>{persona.name}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {currentOutfit && weather && (
        <div className="px-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header & Context Summary */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">Current Aura</span>
              <div className="flex items-center gap-2">
                {!isLocationExpanded ? (
                  <button onClick={() => setIsLocationExpanded(true)} className="flex items-center gap-2 group">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{weather.location}</h2>
                    <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                  </button>
                ) : (
                  <div className="relative">
                    <form onSubmit={handleManualSearch} className="flex gap-1 relative z-[150]">
                      <input autoFocus type="text" value={locationInput} onChange={handleInputChange} className="bg-white rounded-xl px-3 py-1.5 text-xs font-black text-gray-950 outline-none w-36 border-2 border-indigo-100 shadow-lg" />
                      <button type="submit" className="p-1.5 bg-indigo-600 rounded-xl text-white shadow-md"><Check className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setIsLocationExpanded(false)} className="p-1.5 bg-white border border-gray-200 rounded-xl text-gray-500"><X className="w-4 h-4" /></button>
                    </form>
                    <SuggestionsDropdown />
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {activePersona.name} • {getDisplayTemp(weather.temp)}°{unit}
              </p>
            </div>
            {/* Fix: Error in file components/StylistTab.tsx on line 381: An expression of type 'void' cannot be tested for truthiness. */}
            {/* Use ternary to avoid using 'void' return from onFitCheck?() in logical OR. */}
            <button 
              onClick={() => onFitCheck ? onFitCheck() : onTabChange(AppTab.VISUALIZE)} 
              className="bg-gray-900 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-lg active:scale-95 group transition-all"
            >
              <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Fit Check</span>
            </button>
          </div>

          {/* New Narrative Block - Placed on Top of Fit */}
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden text-center">
            <Sparkles className="absolute -top-4 -right-4 w-20 h-20 opacity-10" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Your Day Guide</p>
            <h3 className="text-xl font-black uppercase tracking-wide leading-tight">
              {currentOutfit.tagline}
            </h3>
          </div>

          {/* The Fit Block - Compacted to show in viewport */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-[1px] flex-1 bg-gray-100" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">The Fit</span>
              <div className="h-[1px] flex-1 bg-gray-100" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <VerdictItem icon={<Shirt className="w-5 h-5" />} label="Outerwear" value={currentOutfit.outerwear} accent="indigo" />
              <VerdictItem icon={<Zap className="w-5 h-5" />} label="Base Layer" value={currentOutfit.baseLayer} accent="indigo" />
              <VerdictItem icon={<Footprints className="w-5 h-5" />} label="Footwear" value={currentOutfit.footwear} accent="indigo" />
            </div>
          </div>

          {/* Split Block: Technical Logic & Pro Tip */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Stylist Reasoning</p>
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                {currentOutfit.styleReasoning}
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-[1.5rem] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-900 leading-tight">
                Pro Tip: {currentOutfit.proTip}
              </p>
            </div>
          </div>

          {/* Explore Button */}
          <button 
            onClick={() => onTabChange(AppTab.PLAN)}
            className="w-full py-5 bg-white border border-indigo-100 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-all group"
          >
            <Compass className="w-4 h-4 text-indigo-600 group-hover:rotate-45 transition-transform" />
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Explore Your Plan for Today</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface VerdictItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "indigo" | "emerald" | "amber" | "rose";
  onAction?: () => void;
}

const VerdictItem: React.FC<VerdictItemProps> = ({ icon, label, value, accent, onAction }) => {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  };

  return (
    <div className="flex items-center gap-4 group" onClick={onAction}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${colors[accent]}`}>
        {icon}
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        </div>
        <h4 className="text-[13px] font-black text-gray-900 leading-tight uppercase tracking-tight line-clamp-2">{value}</h4>
      </div>
    </div>
  );
};

export default StylistTab;
