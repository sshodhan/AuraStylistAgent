
import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherData, OutfitSuggestion, GroundingLink, AppTab } from '../types';
import { getPlanRecommendations } from '../services/geminiService';
import { 
  MapPin, 
  ExternalLink, 
  Loader2, 
  Compass, 
  Coffee, 
  Store, 
  Navigation, 
  AlertCircle, 
  Maximize2, 
  Crosshair, 
  Sparkles, 
  ArrowRight,
  Zap,
  Waves,
  Map as MapIcon,
  ChevronDown,
  Info
} from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  onTabChange: (tab: AppTab) => void;
}

// Enhanced Markdown-like parser for the Strategy section
const StrategyFormatter: React.FC<{ text: string, inverse?: boolean }> = ({ text, inverse = false }) => {
  // Split into lines and process structured patterns
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  return (
    <div className="space-y-5">
      {lines.map((line, idx) => {
        // Detect if it's a list item (e.g., "1. ", "• ")
        const isListItem = /^\d+\.\s|^\*\s|^•\s|^- \s/.test(line);
        const cleanLine = line.replace(/^\d+\.\s|^\*\s|^•\s|^- \s/, '');
        
        // Handle bolding within the line
        const parts = cleanLine.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*)/g);
        
        const content = (
          <span className={`text-sm font-bold leading-relaxed tracking-tight ${inverse ? 'text-indigo-50/90' : 'text-gray-700'}`}>
            {parts.map((part, i) => {
              if (part.startsWith('**')) {
                const clean = part.replace(/\*/g, '');
                return (
                  <span key={i} className={`font-black ${inverse ? 'text-indigo-300 underline decoration-indigo-500/30' : 'text-indigo-900'} underline-offset-4`}>
                    {clean}
                  </span>
                );
              }
              return part;
            })}
          </span>
        );

        if (isListItem) {
          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: -5 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: idx * 0.05 }}
              className="flex gap-4 items-start"
            >
              <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${inverse ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-indigo-600'}`} />
              {content}
            </motion.div>
          );
        }

        return (
          <motion.p 
            key={idx}
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className={`text-sm leading-relaxed ${inverse ? 'text-indigo-50/80 font-medium' : 'text-gray-600 font-medium italic'}`}
          >
            {content}
          </motion.p>
        );
      })}
    </div>
  );
};

interface LocalizedGem extends GroundingLink {
  lat: number;
  lon: number;
  id: string;
}

const PlanTab: React.FC<Props> = ({ weather, outfit, onTabChange }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [gems, setGems] = useState<LocalizedGem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'eat' | 'explore' | 'shop'>('all');
  const [activeGemId, setActiveGemId] = useState<string | null>(null);
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const initialLat = weather?.coords?.lat || 47.6062;
    const initialLon = weather?.coords?.lon || -122.3321;
    
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([initialLat, initialLon], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const fetchPlan = async () => {
    if (!weather || !outfit) return;
    setLoading(true);
    setError(null);
    const baseLat = weather.coords?.lat || 47.6062;
    const baseLon = weather.coords?.lon || -122.3321;

    try {
      const result = await getPlanRecommendations(weather.location, outfit, baseLat, baseLon);
      setRecommendations(result.text);
      const localized = result.links.map((link, idx) => ({
        ...link,
        id: `gem-${idx}`,
        lat: baseLat + (Math.random() - 0.5) * 0.03,
        lon: baseLon + (Math.random() - 0.5) * 0.03,
      }));
      setGems(localized);
    } catch (err) {
      setError("Grounding search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (outfit && weather && gems.length === 0) {
      fetchPlan();
    }
  }, [outfit, weather]);

  const filteredGems = useMemo(() => {
    return activeFilter === 'all' ? gems : gems.filter(g => g.type === activeFilter);
  }, [gems, activeFilter]);

  useEffect(() => {
    if (!markerGroupRef.current || !mapInstanceRef.current) return;
    markerGroupRef.current.clearLayers();

    filteredGems.forEach(gem => {
      const isSelected = gem.id === activeGemId;
      const iconHtml = `
        <div class="relative flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-125' : 'scale-100'}">
          ${isSelected ? '<div class="absolute w-10 h-10 bg-indigo-500/30 rounded-full animate-ping"></div>' : ''}
          <div class="w-8 h-8 ${isSelected ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-white shadow-lg'} rounded-2xl flex items-center justify-center border-2 border-indigo-600/10 z-10">
            ${gem.type === 'eat' ? '<span class="text-xs">☕</span>' : 
              gem.type === 'explore' ? '<span class="text-xs">🧭</span>' : 
              '<span class="text-xs">🛍️</span>'}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([gem.lat, gem.lon], { icon }).addTo(markerGroupRef.current!);
      marker.on('click', () => handleLocateGem(gem));
    });

    if (filteredGems.length > 0) {
      const bounds = L.latLngBounds(filteredGems.map(g => [g.lat, g.lon]));
      mapInstanceRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 1.5 });
    }
  }, [filteredGems, activeGemId]);

  const handleLocateGem = (gem: LocalizedGem) => {
    setActiveGemId(gem.id);
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([gem.lat, gem.lon], 15, { duration: 1.2 });
    }
  };

  const handleRecenter = () => {
    if (weather?.coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([weather.coords.lat, weather.coords.lon], 14, { duration: 1 });
      setActiveGemId(null);
    }
  };

  if (!outfit || !weather) {
    return (
      <div className="h-[70dvh] flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-50 p-6 rounded-full">
          <MapPin className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-base font-black text-gray-900 uppercase">Awaiting Context</h3>
        <p className="text-xs text-gray-500 max-w-xs font-medium">Generate your styling verdict first to see your personalized itinerary.</p>
        <button onClick={() => onTabChange(AppTab.STYLIST)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mt-4">Go to Stylist</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Plan Brief Cards */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">The Plan Brief</h2>
           <div className="bg-indigo-50 px-2.5 py-1.5 rounded-full flex items-center gap-2">
              <Zap className="w-3 h-3 text-indigo-600" />
              <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Atmosphere Match</span>
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
           <PlanSummaryCard icon={<Compass className="w-4 h-4" />} label="Activity" value={outfit.activity} accent="emerald" />
           <PlanSummaryCard icon={<Coffee className="w-4 h-4" />} label="Vibe Stop" value={outfit.coffeeSpot} accent="amber" />
           <PlanSummaryCard icon={<Store className="w-4 h-4" />} label="Nearby Hunting" value={outfit.storeType} accent="rose" />
        </div>
      </div>

      {/* Map Module */}
      <div className="relative h-[340px] shrink-0 rounded-[3rem] overflow-hidden border border-gray-100 shadow-2xl bg-gray-50 mx-1">
        <div ref={mapContainerRef} className="h-full w-full" id="aura-map-container" />
        
        <div className="absolute top-4 inset-x-4 z-[1000] flex justify-between items-center pointer-events-none">
          <div className="flex gap-1.5 pointer-events-auto overflow-x-auto scrollbar-hide pb-1 pr-4">
             <MapChip active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>All Gems</MapChip>
             <MapChip active={activeFilter === 'eat'} onClick={() => setActiveFilter('eat')}>Eat</MapChip>
             <MapChip active={activeFilter === 'explore'} onClick={() => setActiveFilter('explore')}>Explore</MapChip>
             <MapChip active={activeFilter === 'shop'} onClick={() => setActiveFilter('shop')}>Shop</MapChip>
          </div>
          <button onClick={handleRecenter} className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 text-indigo-600 active:scale-95 transition-all pointer-events-auto shrink-0">
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-6 inset-x-0 z-[1000] pointer-events-none">
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between px-6">
                 <div className="bg-black/80 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Curated Matches</span>
                 </div>
             </div>
             
             <div className="flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide pointer-events-auto snap-x">
                {filteredGems.length > 0 ? filteredGems.map((gem) => (
                   <motion.button
                    key={gem.id}
                    onClick={() => handleLocateGem(gem)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex-shrink-0 w-52 bg-white/95 backdrop-blur-2xl p-4 rounded-[2rem] shadow-2xl border transition-all snap-center flex flex-col gap-2 group text-left ${
                      gem.id === activeGemId ? 'border-indigo-600 scale-[1.02]' : 'border-white/40 hover:bg-white'
                    }`}
                   >
                      <div className="flex items-center justify-between">
                         <div className={`p-2 rounded-xl ${
                            gem.type === 'eat' ? 'bg-amber-50 text-amber-600' :
                            gem.type === 'explore' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-rose-50 text-rose-600'
                         }`}>
                            {gem.type === 'eat' ? <Coffee className="w-3.5 h-3.5" /> :
                             gem.type === 'explore' ? <Compass className="w-3.5 h-3.5" /> :
                             <Store className="w-3.5 h-3.5" />}
                         </div>
                         <div className={`text-[8px] font-black uppercase tracking-widest ${gem.id === activeGemId ? 'text-indigo-600' : 'text-gray-300'}`}>
                           {gem.id === activeGemId ? 'Located' : 'Locate'}
                         </div>
                      </div>
                      <div className="space-y-0.5">
                         <h5 className="text-[11px] font-black text-gray-950 uppercase tracking-tight line-clamp-1">{gem.title}</h5>
                         <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Perfect Match</p>
                      </div>
                   </motion.button>
                )) : (
                   <div className="w-full text-center py-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white/20">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching gems nearby</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Itinerary Logic & Details */}
      <div className="px-2 space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="relative">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <Navigation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 animate-pulse" />
             </div>
             <div className="text-center space-y-1">
                <p className="text-[11px] font-black uppercase text-gray-900 tracking-widest">Aura Intelligence Active</p>
                <p className="text-[9px] font-medium text-gray-400 uppercase">Grounding itinerary in real-time data...</p>
             </div>
          </div>
        ) : (
          <>
            {/* Itinerary Strategy Card - Collapsible */}
            {recommendations && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="bg-gray-950 rounded-[3.5rem] shadow-2xl relative overflow-hidden mx-1"
              >
                <button 
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                  className="w-full p-8 flex items-center justify-between text-left group relative z-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-0.5">Itinerary Strategy</h4>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Click to {isStrategyExpanded ? 'Collapse' : 'Expand'} logic</p>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl bg-white/5 border border-white/10 transition-transform duration-500 ${isStrategyExpanded ? 'rotate-180' : 'rotate-0'}`}>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </div>
                </button>

                <AnimatePresence>
                  {isStrategyExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: "circOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-10 relative">
                        <Waves className="absolute -bottom-10 -right-10 w-48 h-48 opacity-[0.03] text-indigo-500 pointer-events-none" />
                        <div className="h-[1px] w-full bg-white/10 mb-8" />
                        <StrategyFormatter text={recommendations} inverse />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Comprehensive Destination Lists */}
            <div className="space-y-12 pb-12">
               <DestinationSection title="Eat & Drink" type="eat" gems={gems} onLocate={handleLocateGem} />
               <DestinationSection title="Explore & Play" type="explore" gems={gems} onLocate={handleLocateGem} />
               <DestinationSection title="Shop & Browse" type="shop" gems={gems} onLocate={handleLocateGem} />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-6 bg-red-50 text-red-700 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest border border-red-100 mx-1">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// UI Atoms
const MapChip: React.FC<{ active: boolean; children: React.ReactNode; onClick: () => void }> = ({ active, children, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-xl border ${
      active 
        ? 'bg-indigo-600 text-white border-transparent' 
        : 'bg-white/95 backdrop-blur-xl text-gray-600 border-white/40 hover:bg-white'
    }`}
  >
    {children}
  </button>
);

const PlanSummaryCard: React.FC<{ icon: React.ReactNode, label: string, value: string, accent: string }> = ({ icon, label, value, accent }) => {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    rose: "text-rose-600 bg-rose-50",
  };
  return (
    <div className="flex items-center gap-5 bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
      <div className={`p-4 rounded-3xl transition-transform group-hover:scale-110 ${colors[accent]}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-xs font-black text-gray-950 uppercase leading-tight tracking-tight">{value}</h4>
      </div>
      <div className="p-2 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );
};

const DestinationSection: React.FC<{ title: string, type: string, gems: LocalizedGem[], onLocate: (gem: LocalizedGem) => void }> = ({ title, type, gems, onLocate }) => {
  const filtered = gems.filter(g => g.type === type);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-3">
        <span className="text-[12px] font-black text-gray-950 uppercase tracking-[0.4em]">{title}</span>
        <div className="h-[1px] flex-1 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((gem, idx) => (
          <motion.div
            key={gem.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[13px] font-black text-gray-950 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{gem.title}</span>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => onLocate(gem)}
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                   >
                     <MapIcon className="w-2.5 h-2.5" />
                     Locate on Map
                   </button>
                   <div className="w-1 h-1 bg-gray-200 rounded-full" />
                   <a 
                    href={gem.uri} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 hover:text-gray-600"
                   >
                     <ExternalLink className="w-2.5 h-2.5" />
                     Open Maps
                   </a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlanTab;
