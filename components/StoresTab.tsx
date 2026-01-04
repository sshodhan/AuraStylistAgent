
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherData, OutfitSuggestion, GroundingLink } from '../types';
import { getStoreLocations } from '../services/geminiService';
import { MapPin, ExternalLink, Loader2, ShoppingBag, Navigation, AlertCircle, Maximize2, Crosshair, ChevronDown, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
}

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  // Simple regex to replace ***text*** or **text** with <b>tags
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

const StoresTab: React.FC<Props> = ({ weather, outfit }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [links, setLinks] = useState<GroundingLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
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

  // Update map center when weather location changes
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

    // Custom Blue Pulse Marker for User/Search Center
    const centerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    L.marker([lat, lon], { icon: centerIcon }).addTo(markerGroupRef.current);
  };

  const fetchStores = async () => {
    if (!weather || !outfit) return;
    setLoading(true);
    setError(null);
    
    const lat = weather.coords?.lat || 47.6062;
    const lon = weather.coords?.lon || -122.3321;

    try {
      const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, lat, lon);
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
      fetchStores();
    }
  }, [outfit, weather]);

  const handleRecenter = () => {
    if (mapCenter && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(mapCenter, 14, { duration: 1 });
    }
  };

  if (!outfit || !weather) {
    return (
      <div className="h-[70dvh] flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-50 p-6 rounded-full">
          <MapPin className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-base font-black text-gray-900 uppercase">Context Missing</h3>
        <p className="text-xs text-gray-500 max-w-xs font-medium">Generate an outfit first to see where to shop.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 pb-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Interactive Map Header */}
      <div className="relative h-[250px] shrink-0 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm bg-gray-100 group">
        <div ref={mapContainerRef} className="h-full w-full" />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button 
            onClick={handleRecenter}
            className="p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 text-indigo-600 active:scale-95 transition-all hover:bg-gray-50"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button 
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 bg-white rounded-xl shadow-lg border border-gray-100 text-gray-600 active:scale-95 transition-all hover:bg-gray-50"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Location Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{weather.location}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
          <ShoppingBag className="text-indigo-600 w-4 h-4" />
          Local Finds
        </h2>
        <button 
          onClick={fetchStores}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          Refresh Search
        </button>
      </div>

      {error && (
        <div className="mx-2 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-50 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Redesigned Reasoning/Insights Block */}
            {recommendations && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
              >
                <button 
                  onClick={() => setIsStrategyExpanded(!isStrategyExpanded)}
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Expert Briefing</p>
                      <h4 className="text-xs font-black text-gray-900 uppercase">Stylist's Selection Strategy</h4>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isStrategyExpanded ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                
                <AnimatePresence>
                  {isStrategyExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-6 border-t border-gray-50 pt-4"
                    >
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border-l-4 border-indigo-600">
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic">
                          <SimpleMarkdown text={recommendations} />
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {!isStrategyExpanded && (
                  <div className="px-5 pb-5 text-center">
                    <button 
                      onClick={() => setIsStrategyExpanded(true)}
                      className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      View reasoning behind these choices
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Verified Locations</h3>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                   <span className="text-[8px] font-black text-gray-400 uppercase">Live Map Data</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {links.length > 0 ? links.map((link, idx) => (
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{link.title}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                           <BookOpen className="w-2.5 h-2.5 text-indigo-300" />
                           <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Verified Destination</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </motion.a>
                )) : (
                  <div className="text-center py-16 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <MapPin className="w-10 h-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting spatial grounding</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StoresTab;
