
import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  Filter,
  Zap,
  Waves,
  Eye
} from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  onTabChange: (tab: AppTab) => void;
}

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**')) {
          const clean = part.replace(/\*/g, '');
          return <span key={i} className="font-black text-indigo-900">{clean}</span>;
        }
        return part;
      })}
    </>
  );
};

const PlanTab: React.FC<Props> = ({ weather, outfit, onTabChange }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [links, setLinks] = useState<GroundingLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'eat' | 'explore' | 'shop'>('all');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = weather?.coords?.lat || 47.6062;
    const initialLon = weather?.coords?.lon || -122.3321;
    
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([initialLat, initialLon], 13);

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

  useEffect(() => {
    if (weather?.coords && mapInstanceRef.current) {
      const { lat, lon } = weather.coords;
      mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1.5 });
      setMapCenter([lat, lon]);
      updateMarkers(lat, lon);
    }
  }, [weather]);

  const updateMarkers = (lat: number, lon: number) => {
    if (!markerGroupRef.current) return;
    markerGroupRef.current.clearLayers();

    // Center Marker (Pulse)
    const centerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-indigo-500/20 rounded-full animate-ping"></div>
              <div class="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg z-10"></div>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([lat, lon], { icon: centerIcon }).addTo(markerGroupRef.current);
  };

  const fetchPlan = async () => {
    if (!weather || !outfit) return;
    setLoading(true);
    setError(null);
    
    const lat = weather.coords?.lat || 47.6062;
    const lon = weather.coords?.lon || -122.3321;

    try {
      const result = await getPlanRecommendations(weather.location, outfit, lat, lon);
      setRecommendations(result.text);
      setLinks(result.links);
    } catch (err) {
      setError("Grounding search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (outfit && weather && !recommendations) {
      fetchPlan();
    }
  }, [outfit, weather]);

  const handleRecenter = () => {
    if (mapCenter && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(mapCenter, 14, { duration: 1 });
    }
  };

  const filteredLinks = activeFilter === 'all' ? links : links.filter(l => l.type === activeFilter);

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
    <div className="h-full flex flex-col space-y-6 pb-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Plan Summary Cards */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">The Plan Brief</h2>
           <div className="bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1.5">
              <Zap className="w-2.5 h-2.5 text-indigo-600" />
              <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Vibe-Synced</span>
           </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
           <PlanSummaryCard icon={<Compass className="w-4 h-4" />} label="Activity" value={outfit.activity} accent="emerald" />
           <PlanSummaryCard icon={<Coffee className="w-4 h-4" />} label="Vibe Stop" value={outfit.coffeeSpot} accent="amber" />
           <PlanSummaryCard icon={<Store className="w-4 h-4" />} label="Nearby Hunting" value={outfit.storeType} accent="rose" />
        </div>
      </div>

      {/* Interactive Map Section with Overlays */}
      <div className="relative h-[320px] shrink-0 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl bg-gray-100 mx-2">
        <div ref={mapContainerRef} className="h-full w-full" />
        
        {/* Floating Header Controls */}
        <div className="absolute top-4 inset-x-4 z-[1000] flex items-center justify-between pointer-events-none">
          <div className="flex gap-1.5 pointer-events-auto overflow-x-auto scrollbar-hide pb-1">
             <MapChip active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>All Vibes</MapChip>
             <MapChip active={activeFilter === 'eat'} onClick={() => setActiveFilter('eat')}>Eat</MapChip>
             <MapChip active={activeFilter === 'explore'} onClick={() => setActiveFilter('explore')}>Explore</MapChip>
             <MapChip active={activeFilter === 'shop'} onClick={() => setActiveFilter('shop')}>Shop</MapChip>
          </div>
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button onClick={handleRecenter} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/40 text-indigo-600 active:scale-95 transition-all"><Crosshair className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Bottom Carousel Overlay */}
        <div className="absolute bottom-6 inset-x-0 z-[1000] pointer-events-none">
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between px-6">
                 <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Gems for Your Look</span>
                 </div>
             </div>
             
             <div 
               ref={carouselRef}
               className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide pointer-events-auto snap-x"
             >
                {filteredLinks.length > 0 ? filteredLinks.map((link, idx) => (
                   <motion.a
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex-shrink-0 w-48 bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/40 flex flex-col gap-2 snap-center group hover:bg-white transition-colors"
                   >
                      <div className="flex items-center justify-between">
                         <div className={`p-1.5 rounded-lg ${
                            link.type === 'eat' ? 'bg-amber-50 text-amber-600' :
                            link.type === 'explore' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-rose-50 text-rose-600'
                         }`}>
                            {link.type === 'eat' ? <Coffee className="w-3 h-3" /> :
                             link.type === 'explore' ? <Compass className="w-3 h-3" /> :
                             <Store className="w-3 h-3" />}
                         </div>
                         <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-600 transition-all" />
                      </div>
                      <div className="space-y-0.5">
                         <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-tight line-clamp-1">{link.title}</h5>
                         <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Perfect Match</p>
                      </div>
                   </motion.a>
                )) : (
                   <div className="w-full text-center py-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/20">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">No gems in this category</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Detailed Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
             <div className="relative">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <Navigation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-pulse" />
             </div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Synchronizing Spatial Intelligence...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Logic Deep Dive */}
            {recommendations && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-950 p-8 rounded-[3.5rem] text-white shadow-2xl shadow-gray-200 relative overflow-hidden mx-1">
                <Waves className="absolute -bottom-10 -left-10 w-48 h-48 opacity-10 text-indigo-500" />
                <div className="flex items-center gap-2 mb-4">
                   <div className="bg-indigo-500 p-2 rounded-xl"><Sparkles className="w-4 h-4 text-white" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Itinerary Reasoning</h4>
                </div>
                <p className="text-sm font-bold leading-relaxed tracking-tight italic text-gray-100">
                  <SimpleMarkdown text={recommendations} />
                </p>
              </motion.div>
            )}

            {/* List Detail Section */}
            <div className="space-y-12 pb-8">
               <PlaceCategorySection title="Eat & Drink" type="eat" links={links} />
               <PlaceCategorySection title="Explore & Play" type="explore" links={links} />
               <PlaceCategorySection title="Shop & Browse" type="shop" links={links} />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-5 bg-red-50 text-red-700 rounded-3xl text-[10px] font-black uppercase tracking-widest border border-red-100 mx-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MapChip: React.FC<{ active: boolean; children: React.ReactNode; onClick: () => void }> = ({ active, children, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
      active 
        ? 'bg-indigo-600 text-white border-transparent' 
        : 'bg-white/80 backdrop-blur-md text-gray-600 border-white/40 hover:bg-white'
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
    <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md group">
      <div className={`p-3.5 rounded-2xl transition-transform group-hover:scale-110 ${colors[accent]}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <h4 className="text-xs font-black text-gray-900 uppercase leading-tight tracking-tight">{value}</h4>
      </div>
      <div className="px-2">
         <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
      </div>
    </div>
  );
};

const PlaceCategorySection: React.FC<{ title: string, type: string, links: GroundingLink[] }> = ({ title, type, links }) => {
  const filtered = links.filter(l => l.type === type);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 px-3">
        <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">{title}</span>
        <div className="h-[1px] flex-1 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((link, idx) => (
          <motion.a
            key={idx}
            href={link.uri}
            target="_blank"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full" />
              </div>
              <div className="space-y-1">
                <span className="text-[13px] font-black text-gray-950 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{link.title}</span>
                <div className="flex items-center gap-2">
                   <div className="px-1.5 py-0.5 bg-gray-50 rounded-md">
                      <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Grounded</p>
                   </div>
                   <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Open in Maps</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
              <ExternalLink className="w-4 h-4" />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default PlanTab;
