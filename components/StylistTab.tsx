
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherData, OutfitSuggestion, TempUnit, AppTab } from '../types';
import { fetchWeather, geocode } from '../services/weatherService';
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
  Pencil
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
  styleContext,
  onStyleContextUpdate
}) => {
  const [locationInput, setLocationInput] = useState('Seattle');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [hoveredPersona, setHoveredPersona] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearchingSuggestions(true);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
      const data = await response.json();
      setSuggestions(data.results || []);
    } catch (err) {
      console.error("Geocoding suggestions failed", err);
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationInput(val);

    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
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
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent, overrideLocation?: string) => {
    if (e) e.preventDefault();
    const loc = overrideLocation || locationInput;
    if (!loc) return;
    
    setLoading(true);
    setError(null);
    try {
      const coords = await geocode(loc);
      if (!coords) throw new Error(`Could not find location: ${loc}`);
      
      const weatherData = await fetchWeather(coords.lat, coords.lon, loc);
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

  const handlePersonaClick = (id: string) => {
    onStyleContextUpdate(id);
    if (weather) {
      refreshSuggestion(weather, id);
    }
  };

  useEffect(() => {
    if (!currentOutfit && !weather) {
      handleGenerate(undefined, 'Seattle');
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
      {/* Visual Hero Card */}
      <div className="relative w-full aspect-[21/9] bg-gray-100 rounded-[1.75rem] overflow-hidden shadow-sm border border-gray-100 shrink-0">
        {(weatherHero && !loading) ? (
          <>
            <img src={weatherHero} alt="Weather" className="w-full h-full object-cover brightness-[0.8]" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <div className="text-white flex items-end justify-between">
                <div>
                   <p className="text-xl font-black tracking-tighter leading-none opacity-90 drop-shadow-md">{getDisplayTemp(weather!.temp)}°{unit}</p>
                </div>
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-[6px] font-black opacity-70 uppercase tracking-tighter mb-0.5 drop-shadow-sm">Wind</p>
                    <p className="text-[9px] font-black drop-shadow-sm">{weather!.wind}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[6px] font-black opacity-70 uppercase tracking-tighter mb-0.5 drop-shadow-sm">Precip</p>
                    <p className="text-[9px] font-black drop-shadow-sm">{weather!.precip}m</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md px-1.5 py-1.5 rounded-lg border border-white/20">
                 {getWeatherIcon(weather!.precip, weather!.temp)}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            <p className="text-[7px] font-black uppercase text-indigo-400 mt-1.5 tracking-widest">Atmosphere Sync...</p>
          </div>
        )}
      </div>

      {/* Enhanced Compact Mood Carousel */}
      <div className="space-y-4 pt-4 relative overflow-hidden">
        <h3 className="px-5 text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">Style Persona</h3>
        
        {/* Gradient overlays for scroll indication */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />
        
        <div 
          ref={carouselRef}
          className="flex gap-3 overflow-x-auto py-2 scrollbar-hide snap-x snap-proximity overscroll-x-contain touch-pan-x select-none px-[calc(50%-40px)]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {STYLE_PERSONAS.map((persona, index) => {
            const Icon = persona.icon;
            const isActive = styleContext === persona.id;
            const isHovered = hoveredPersona === persona.id;

            return (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 snap-center relative"
              >
                <button
                  onClick={() => handlePersonaClick(persona.id)}
                  onMouseEnter={() => setHoveredPersona(persona.id)}
                  onMouseLeave={() => setHoveredPersona(null)}
                  className={`relative w-20 h-20 rounded-3xl border-2 flex flex-col items-center justify-center outline-none transition-all duration-300 transform-gpu ${
                    isActive 
                      ? `bg-gradient-to-br ${persona.color} border-transparent text-white shadow-xl shadow-indigo-100 scale-105 z-10` 
                      : `${persona.bgColor} border-gray-100 text-gray-400 hover:border-indigo-100 active:scale-90 active:duration-100`
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                >
                  <AnimatePresence>
                    {(isHovered || isActive) && (
                      <motion.div
                        className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                        initial={{ opacity: 0, scale: 0, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: 5 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <div className="text-sm bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-gray-50">
                          {persona.emoji}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`p-1.5 rounded-xl mb-1 transition-colors duration-300 ${isActive ? 'bg-white/20' : 'bg-gray-50'}`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>

                  <div className="text-center flex flex-col px-1 leading-none">
                    <span className={`text-[8px] font-black uppercase tracking-tight transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {persona.name}
                    </span>
                  </div>

                  {isActive && (
                     <div className="absolute -top-1 -right-1 animate-in zoom-in duration-300">
                       <div className="bg-white rounded-full p-0.5 shadow-md border border-indigo-100">
                         <Check className="w-2 h-2 text-indigo-600 stroke-[5px]" />
                       </div>
                     </div>
                  )}

                  {isActive && (
                    <>
                      <motion.div
                        className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      />
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mx-1 p-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100 flex items-center gap-2">
          <X className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Verdict Card with Enhanced Integrated Location & Typeahead */}
      {currentOutfit && weather && (
        <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${loading ? 'opacity-50 grayscale-[0.5]' : 'opacity-100 animate-in slide-in-from-bottom-2'}`}>
          <div className="p-5 space-y-3.5">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none mb-1">
                  STYLIST VERDICT
                </span>
                
                <div className="relative">
                  {!isLocationExpanded ? (
                    <button 
                      onClick={() => {
                        setIsLocationExpanded(true);
                        setLocationInput(weather.location);
                      }}
                      className="flex items-center gap-2 bg-blue-50/40 px-3.5 py-1.5 rounded-full border-2 border-blue-600/30 hover:border-blue-600 transition-all active:scale-95 group"
                    >
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span className="text-[11px] font-black text-blue-700 uppercase tracking-tight">
                        {weather.location}
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                  ) : (
                    <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200 z-50 relative">
                      <form onSubmit={handleGenerate} className="flex gap-1">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 w-3 h-3" />
                          <input
                            type="text"
                            autoFocus
                            value={locationInput}
                            onChange={handleInputChange}
                            placeholder="Type a city..."
                            className="w-full pl-8 pr-8 py-2.5 bg-white border-2 border-indigo-600 rounded-xl outline-none text-[12px] font-black text-black shadow-lg"
                          />
                          {locationInput && (
                            <button 
                              type="button" 
                              onClick={() => setLocationInput('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsLocationExpanded(false)}
                          className="px-2 bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                        >
                           <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                      </form>

                      {(suggestions.length > 0 || isSearchingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[60]">
                          {isSearchingSuggestions && (
                            <div className="p-3 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                            </div>
                          )}
                          {suggestions.map((city, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectCity(city)}
                              className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex flex-col border-b border-gray-50 last:border-none transition-colors"
                            >
                              <span className="text-[11px] font-black text-gray-900 uppercase">{city.name}</span>
                              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {city.admin1 ? `${city.admin1}, ` : ''}{city.country}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Fit Check Button with Sparkle Treatment */}
              <button
                onClick={() => onTabChange(AppTab.VISUALIZE)}
                disabled={loading}
                className="relative overflow-hidden bg-slate-900 text-white px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-xl active:scale-95 transition-all hover:shadow-indigo-200/50 hover:bg-black group disabled:bg-gray-300"
              >
                {/* Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                  animate={{ x: ['-150%', '150%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                />
                
                {/* Floating Particle Sparkles */}
                <AnimatePresence>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-0.5 h-0.5 bg-indigo-300 rounded-full pointer-events-none"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1.5, 0],
                        x: [0, (i - 1) * 15],
                        y: [0, -10 - (i * 5)]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.4,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </AnimatePresence>

                <div className="relative flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-white group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Fit Check</span>
                  <Sparkles className="w-2.5 h-2.5 text-indigo-300 animate-pulse" />
                </div>
              </button>
            </div>
            
            <div className="space-y-3 pt-2 border-t border-gray-50">
              <OutfitSmallItem label="CORE" value={currentOutfit.baseLayer} />
              <OutfitSmallItem label="SHELL" value={currentOutfit.outerwear} />
              <OutfitSmallItem label="STEP" value={currentOutfit.footwear} />
            </div>

            <div className="pt-1.5">
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic opacity-90 border-l-2 border-indigo-100 pl-3">
                "{currentOutfit.proTip}"
              </p>
            </div>
          </div>

          {outfitImage && (
            <div className="aspect-[3/4] relative group border-t border-gray-50">
              <img src={outfitImage} alt="Visual" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-5 flex justify-end">
                 <a href={outfitImage} download className="p-3.5 bg-white rounded-2xl text-indigo-600 shadow-2xl active:scale-90 transition-all"><Download className="w-5 h-5" /></a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OutfitSmallItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex gap-4 items-start">
    <span className="w-12 text-[8px] font-black text-indigo-400 uppercase mt-1 tracking-widest shrink-0">{label}</span>
    <p className="flex-1 text-[12px] font-black text-gray-900 leading-tight tracking-tight">{value}</p>
  </div>
);

export default StylistTab;
