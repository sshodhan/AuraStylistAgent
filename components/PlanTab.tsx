
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
  ChevronDown
} from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  onTabChange: (tab: AppTab) => void;
}

// Formatter to turn the "blob" of text into readable segments
const StrategyFormatter: React.FC<{ text: string, inverse?: boolean }> = ({ text, inverse = false }) => {
  const sections = text.split('\n').filter(s => s.trim().length > 0 && !s.includes('- Reason:'));
  
  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const isBullet = section.trim().startsWith('*') || section.trim().startsWith('-') || /^\d+\./.test(section.trim());
        const cleanText = section.replace(/^[\*\-\d\.]+\s*/, '');
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);

        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex gap-3"
          >
            {isBullet && <div className={`w-1 h-1 rounded-full mt-2 shrink-0 ${inverse ? 'bg-indigo-400' : 'bg-indigo-600'}`} />}
            <p className={`text-[11px] leading-relaxed font-bold tracking-tight ${inverse ? 'text-indigo-50/90' : 'text-gray-700'}`}>
              {parts.map((part, i) => {
                if (part.startsWith('**')) {
                  return (
                    <span key={i} className={`font-black ${inverse ? 'text-indigo-300' : 'text-indigo-900'}`}>
                      {part.replace(/\*/g, '')}
                    </span>
                  );
                }
                return part;
              })}
            </p>
          </motion.div>
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstanceRef.current);
    markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  const fetchPlan = async () => {
    if (!weather || !outfit) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPlanRecommendations(weather.location, outfit, weather.coords?.lat || 0, weather.coords?.lon || 0);
      setRecommendations(result.text);
      setGems(result.links.map((link, idx) => ({
        ...link,
        id: `gem-${idx}`,
        lat: (weather.coords?.lat || 0) + (Math.random() - 0.5) * 0.02,
        lon: (weather.coords?.lon || 0) + (Math.random() - 0.5) * 0.02,
      })));
    } catch (err) { setError("Grounding failed."); } finally { setLoading(false); }
  };

  useEffect(() => { if (outfit && weather && gems.length === 0) fetchPlan(); }, [outfit, weather]);

  const filteredGems = useMemo(() => activeFilter === 'all' ? gems : gems.filter(g => g.type === activeFilter), [gems, activeFilter]);

  useEffect(() => {
    if (!markerGroupRef.current || !mapInstanceRef.current) return;
    markerGroupRef.current.clearLayers();
    filteredGems.forEach(gem => {
      const isSelected = gem.id === activeGemId;
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 ${isSelected ? 'bg-indigo-600' : 'bg-white'} rounded-2xl shadow-xl flex items-center justify-center border-2 border-indigo-600/10 transition-all ${isSelected ? 'scale-125' : ''}">
          <span class="text-xs">${gem.type === 'eat' ? '☕' : gem.type === 'explore' ? '🧭' : '🛍️'}</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([gem.lat, gem.lon], { icon }).addTo(markerGroupRef.current!).on('click', () => handleLocateGem(gem));
    });
  }, [filteredGems, activeGemId]);

  const handleLocateGem = (gem: LocalizedGem) => {
    setActiveGemId(gem.id);
    mapInstanceRef.current?.flyTo([gem.lat, gem.lon], 15, { duration: 1.2 });
  };

  if (!outfit || !weather) return null;

  return (
    <div className="flex flex-col space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Brief Section */}
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

      {/* Map View */}
      <div className="relative h-[280px] rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-2xl bg-gray-50 mx-1">
        <div ref={mapContainerRef} className="h-full w-full" id="aura-map-container" />
        <div className="absolute top-4 inset-x-4 z-[1000] flex justify-between items-center pointer-events-none">
          <div className="flex gap-1.5 pointer-events-auto overflow-x-auto scrollbar-hide pb-2">
             {['all', 'eat', 'explore', 'shop'].map(f => (
               <button key={f} onClick={() => setActiveFilter(f as any)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/95 backdrop-blur-md text-gray-600 shadow-sm'}`}>
                 {f === 'all' ? 'All Gems' : f}
               </button>
             ))}
          </div>
          <button onClick={() => mapInstanceRef.current?.flyTo([weather.coords?.lat || 0, weather.coords?.lon || 0], 14)} className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 text-indigo-600 pointer-events-auto">
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-2 space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
             <p className="text-[11px] font-black uppercase text-gray-900 tracking-widest">Generating Itinerary...</p>
          </div>
        ) : (
          <>
            {/* Collapsible Strategy Card - Matching Screenshot */}
            {recommendations && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden mx-1">
                <button 
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                  className="w-full p-6 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">Itinerary Strategy</h4>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase mt-0.5 tracking-widest opacity-80">
                        {isStrategyExpanded ? 'Collapse Details' : 'Expand Details'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-indigo-300 transition-transform duration-500 ${isStrategyExpanded ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                <AnimatePresence>
                  {isStrategyExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4 }} className="px-8 pb-10">
                      <div className="h-[1px] bg-white/10 mb-6" />
                      <StrategyFormatter text={recommendations} inverse />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Destination Sections with 3-item limit and VV expansion */}
            <div className="space-y-12">
               <DestinationSection title="Eat & Drink" type="eat" gems={gems} onLocate={handleLocateGem} />
               <DestinationSection title="Explore & Play" type="explore" gems={gems} onLocate={handleLocateGem} />
               <DestinationSection title="Shop & Browse" type="shop" gems={gems} onLocate={handleLocateGem} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PlanSummaryCard: React.FC<{ icon: React.ReactNode, label: string, value: string, accent: string }> = ({ icon, label, value, accent }) => {
  const colors: Record<string, string> = { emerald: "text-emerald-600 bg-emerald-50", amber: "text-amber-600 bg-amber-50", rose: "text-rose-600 bg-rose-50" };
  return (
    <div className="flex items-center gap-5 bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
      <div className={`p-4 rounded-3xl ${colors[accent]}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-xs font-black text-gray-900 uppercase leading-tight tracking-tight line-clamp-1">{value}</h4>
      </div>
      <ArrowRight className="w-3 h-3 text-gray-300 mr-2" />
    </div>
  );
};

const DestinationSection: React.FC<{ title: string, type: string, gems: LocalizedGem[], onLocate: (gem: LocalizedGem) => void }> = ({ title, type, gems, onLocate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const filtered = gems.filter(g => g.type === type);
  if (filtered.length === 0) return null;

  const displayItems = isExpanded ? filtered : filtered.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-3">
        <span className="text-[12px] font-black text-gray-950 uppercase tracking-[0.4em]">{title}</span>
        <div className="h-[1px] flex-1 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {displayItems.map((gem) => (
          <motion.div 
            key={gem.id} 
            onClick={() => onLocate(gem)}
            layout
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-5">
              <div className="bg-indigo-50 p-4 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border-2 border-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[13px] font-black text-gray-950 uppercase tracking-tight line-clamp-1">{gem.title}</span>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                  {gem.reason || "Verified for your current mood."}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300" />
          </motion.div>
        ))}
      </div>
      {filtered.length > 3 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-4 bg-gray-50 border border-gray-100 rounded-[2rem] text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:shadow-md transition-all active:scale-95"
        >
          {isExpanded ? (
            <>Collapse Details <ChevronDown className="w-4 h-4 rotate-180" /></>
          ) : (
            <>View All (${filtered.length}) <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default PlanTab;
