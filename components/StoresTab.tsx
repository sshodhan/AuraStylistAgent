import React, { useState, useEffect } from 'react';
import { WeatherData, OutfitSuggestion, GroundingLink } from '../types';
import { getStoreLocations } from '../services/geminiService';
import { MapPin, ExternalLink, Loader2, ShoppingBag, Navigation, AlertCircle } from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
}

const StoresTab: React.FC<Props> = ({ weather, outfit }) => {
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [links, setLinks] = useState<GroundingLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = async () => {
    if (!weather || !outfit) return;
    setLoading(true);
    setError(null);
    
    const defaultLat = 47.6062;
    const defaultLon = -122.3321;

    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, pos.coords.latitude, pos.coords.longitude);
              setRecommendations(result.text);
              setLinks(result.links);
              setLoading(false);
            } catch (err) {
              setError("Failed to fetch store data.");
              setLoading(false);
            }
          }, 
          async (geoErr) => {
            console.warn("Geolocation blocked or failed:", geoErr);
            setError("Location access denied. Using city default.");
            try {
              const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, defaultLat, defaultLon);
              setRecommendations(result.text);
              setLinks(result.links);
            } catch (err) {
              setError("Failed to fetch store data.");
            }
            setLoading(false);
          },
          { timeout: 10000 }
        );
      } else {
        const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, defaultLat, defaultLon);
        setRecommendations(result.text);
        setLinks(result.links);
        setLoading(false);
      }
    } catch (err) {
      setError("Search failed.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (outfit && weather && !recommendations) {
      fetchStores();
    }
  }, [outfit, weather]);

  if (!outfit || !weather) {
    return (
      <div className="h-[70dvh] flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-50 p-6 rounded-full">
          <MapPin className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-base font-black text-gray-900 uppercase">Context Missing</h3>
        <p className="text-xs text-gray-500 max-w-xs font-medium">Generate an outfit in the Stylist tab to see where you can shop this look locally.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          <ShoppingBag className="text-indigo-600 w-5 h-5" />
          Shop Nearby
        </h2>
        <button 
          onClick={fetchStores}
          disabled={loading}
          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {recommendations && (
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-600 leading-relaxed italic">{recommendations}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Verified Locations</h3>
              <div className="grid grid-cols-1 gap-3">
                {links.length > 0 ? links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.uri}
                    target="_blank"
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-gray-800">{link.title}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-300" />
                  </a>
                )) : (
                  <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No local links found</p>
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