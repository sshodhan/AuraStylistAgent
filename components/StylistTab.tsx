
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
  Download, 
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
  X,
  Pencil,
  Shield,
  Wind,
  Thermometer,
  Info,
  Compass,
  Store,
  ArrowRight,
  Navigation,
  Cloud,
  AlertCircle
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
      console.error("Geocoding failed", err);
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
    try {
      const coords = await geocode(locationInput);
      if (!coords) throw new Error("City not found");
      const weatherData = await fetchWeather(coords.lat, coords.lon, locationInput);
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
          // New: Perform reverse geocoding to get real city name
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
        setError("Permission denied. Please allow location access.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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

  // Onboarding View
  if (!weather && !loading && !isLocating) {
    return (
      <div className="min-h-[70dvh] flex flex-col items-center justify-center p-6 space-y-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-100">
            <Cloud className="text-white w-12 h-12" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-2 -right-2 bg-indigo-400 w-6 h-6 rounded-full blur-xl"
          />
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Welcome to Aura</h1>
          <p className="text-sm text-gray-400 font-medium px-8 leading-relaxed">
            Connect your environment to unlock professional styling verdicts.
          </p>
        </div>

        <div className="w-full space-y-4 pt-4">
          <button 
            onClick={handleDetectLocation}
            disabled={isLocating}
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

          <form onSubmit={handleManualSearch} className="relative">
            <input 
              type="text" 
              value={locationInput}
              onChange={handleInputChange}
              placeholder="Search City..."
              className="w-full bg-white border border-gray-100 rounded-[2rem] px-6 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-gray-900 text-white rounded-2xl active:scale-90 transition-all">
              <Search className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden z-[100]"
                >
                  {suggestions.map((city, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => selectCity(city)} 
                      className="w-full px-6 py-4 text-left hover:bg-indigo-50 text-[11px] font-black text-gray-900 uppercase tracking-tight border-b last:border-0 border-gray-50 flex justify-between items-center"
                    >
                      <span>{city.name}, {city.country}</span>
                      <ArrowRight className="w-3 h-3 text-indigo-300" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4 overflow-x-hidden">
      {/* Visual Hero Card */}
      <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-[1.75rem] overflow-hidden shadow-sm border border-gray-100 shrink-0">
        {(weatherHero && !loading && !isLocating) ? (
          <>
            <img src={weatherHero} alt="Weather" className="w-full h-full object-cover brightness-[0.8]" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
              <div className="text-white flex items-end justify-between">
                <p className="text-2xl font-black tracking-tighter leading-none opacity-90">{getDisplayTemp(weather!.temp)}°{unit}</p>
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-[6px] font-black opacity-70 uppercase mb-0.5">Wind</p>
                    <p className="text-[10px] font-black">{weather!.wind}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[6px] font-black opacity-70 uppercase mb-0.5">Precip</p>
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
          {STYLE_PERSONAS.map((persona, index) => {
            const Icon = persona.icon;
            const isActive = styleContext === persona.id;
            return (
              <motion.div key={persona.id} className="flex-shrink-0 snap-center">
                <button
                  onClick={() => handlePersonaClick(persona.id)}
                  className={`relative w-24 h-24 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${persona.color} border-transparent text-white shadow-xl scale-105 z-10` 
                      : `${persona.bgColor} border-gray-100 text-gray-400 hover:border-indigo-200`
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {persona.name}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Recommendation Section */}
      {currentOutfit && weather && (
        <div className="px-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">Curating For</span>
              {!isLocationExpanded ? (
                <button onClick={() => setIsLocationExpanded(true)} className="flex items-center gap-2 group">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-indigo-600">{weather.location}</h2>
                  <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                </button>
              ) : (
                <form onSubmit={handleManualSearch} className="flex gap-1">
                  <input autoFocus type="text" value={locationInput} onChange={handleInputChange} className="bg-gray-100 rounded-xl px-3 py-1 text-xs font-black outline-none w-32" />
                  <button type="submit" className="p-1 bg-indigo-600 rounded-xl text-white"><Check className="w-3 h-3" /></button>
                  <button type="button" onClick={() => setIsLocationExpanded(false)} className="p-1 bg-gray-200 rounded-xl text-gray-500"><X className="w-3 h-3" /></button>
                </form>
              )}
            </div>
            <button onClick={() => onFitCheck?.() || onTabChange(AppTab.VISUALIZE)} className="bg-gray-900 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg active:scale-95 group transition-all">
              <Camera className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Fit Check</span>
            </button>
          </div>

          {/* Lifestyle Grid with Scanning State */}
          <div className="grid grid-cols-1 gap-4 relative">
             <InteractiveInsightCard 
              type="outfit" label="THE FIT" 
              title={currentOutfit.outerwear} subtitle={currentOutfit.baseLayer}
              icon={<Shirt className="w-5 h-5" />} accent="indigo" badge={`${weather.wind}k Protection`}
              reason={currentOutfit.styleReasoning} loading={loading} index={0}
             />
             <InteractiveInsightCard 
              type="activity" label="THE PLAY" 
              title={currentOutfit.activity} subtitle="Weather Match"
              icon={<Compass className="w-5 h-5" />} accent="emerald" badge="Perfect Match"
              reason={`Ideal conditions in ${weather.location} for this activity.`} loading={loading} index={1}
             />
             <InteractiveInsightCard 
              type="vibe" label="THE VIBE" 
              title={currentOutfit.coffeeSpot} subtitle="Refuel Stop"
              icon={<Coffee className="w-5 h-5" />} accent="amber" badge={weather.precip > 0 ? "Indoor Choice" : "Open Air"}
              reason="A tailored atmosphere for your current styling context." loading={loading} index={2}
             />
             <InteractiveInsightCard 
              type="hunt" label="THE HUNT" 
              title={currentOutfit.storeType} subtitle="Nearby Options"
              icon={<Store className="w-5 h-5" />} accent="rose" badge="Maps Ready"
              reason="Local retailers stocked with today's required aesthetics."
              onAction={() => onTabChange(AppTab.STORES)} loading={loading} index={3}
             />
          </div>

          {/* Stylist Tip */}
          <motion.div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] flex items-start gap-4 relative overflow-hidden shadow-sm">
            <div className="bg-white p-3 rounded-2xl text-indigo-600 shadow-sm"><Sparkles className="w-5 h-5" /></div>
            <div className="space-y-1.5 pr-6">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Stylist's Final Note</p>
              <p className="text-xs font-bold text-indigo-900 leading-relaxed italic">"{currentOutfit.proTip}"</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface InsightCardProps {
  type: string; label: string; title: string; subtitle: string; icon: React.ReactNode; 
  accent: "indigo" | "emerald" | "amber" | "rose"; badge: string; reason: string; 
  onAction?: () => void; loading: boolean; index: number;
}

const InteractiveInsightCard: React.FC<InsightCardProps> = ({ label, title, subtitle, icon, accent, badge, reason, onAction, loading, index }) => {
  const [expanded, setExpanded] = useState(false);
  const colors = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', accent: 'bg-indigo-600', ring: 'ring-indigo-600/10' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', accent: 'bg-emerald-600', ring: 'ring-emerald-600/10' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', accent: 'bg-amber-600', ring: 'ring-amber-600/10' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', accent: 'bg-rose-600', ring: 'ring-rose-600/10' },
  };
  const c = colors[accent];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className={`relative bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all overflow-hidden ${expanded ? `ring-4 ${c.ring}` : ''}`}
      onClick={() => !loading && setExpanded(!expanded)}
    >
      {/* Scanning Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2">
               <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden w-24">
                  <motion.div 
                    animate={{ x: [-100, 100] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className={`h-full w-12 ${c.accent}`}
                  />
               </div>
               <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${c.text}`}>Analyzing DNA</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full ${c.bg} ${c.text} text-[8px] font-black uppercase tracking-widest`}>{label}</div>
        <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${c.accent} ${loading ? 'animate-bounce' : 'animate-pulse'}`} />
           <span className="text-[9px] font-black text-gray-400 uppercase">{loading ? "Updating..." : badge}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-3xl transition-all ${expanded ? `${c.accent} text-white` : `${c.bg} ${c.text}`}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-black text-gray-900 uppercase truncate tracking-tight ${loading ? 'blur-sm' : ''}`}>{title}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{subtitle}</p>
        </div>
        {onAction ? (
           <button onClick={(e) => { e.stopPropagation(); onAction(); }} className={`p-3 rounded-2xl ${c.bg} ${c.text} active:scale-90 transition-transform`}><ArrowRight className="w-4 h-4" /></button>
        ) : (
          <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </div>

      <AnimatePresence>
        {expanded && !loading && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-6 mt-6 border-t border-gray-50">
               <p className={`text-[11px] font-bold ${c.text} opacity-80 italic leading-relaxed`}>"{reason}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StylistTab;
