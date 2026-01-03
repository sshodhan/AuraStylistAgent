
import React, { useState, useEffect } from 'react';
import { WeatherData, OutfitSuggestion, GroundingLink } from '../types';
import { getStoreLocations } from '../services/geminiService';
import { MapPin, ExternalLink, Loader2, ShoppingBag, Navigation } from 'lucide-react';

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
    try {
      // Find current lat/lon from geolocation or default to weather data
      let lat = 47.6062;
      let lon = -122.3321;
      
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, pos.coords.latitude, pos.coords.longitude);
          setRecommendations(result.text);
          setLinks(result.links);
        }, async () => {
          // Fallback if geoloc denied
          const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, lat, lon);
          setRecommendations(result.text);
          setLinks(result.links);
        });
      } else {
        const result = await getStoreLocations(weather.location, outfit.outerwear || outfit.baseLayer, lat, lon);
        setRecommendations(result.text);
        setLinks(result.links);
      }
    } catch (err) {
      setError("Failed to fetch nearby stores.");
    } finally {
      if (!("geolocation" in navigator)) setLoading(false);
      // If geoloc used, loading state is managed inside the callbacks
      setTimeout(() => setLoading(false), 2000); 
    }
  };

  useEffect(() => {
    if (outfit && weather && !recommendations) {
      fetchStores();
    }
  }, [outfit, weather]);

  if (!outfit || !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-100 p-6 rounded-full">
          <MapPin className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Search is disabled</h3>
        <p className="text-gray-500 max-w-xs">Generate an outfit first to see where you can shop the look.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-indigo-600" />
          Shop the Look
        </h2>
        <button 
          onClick={fetchStores}
          disabled={loading}
          className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          Refresh Nearby
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {recommendations && (
            <div className="bg-white p-6 rounded-2xl border shadow-sm prose prose-indigo max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{recommendations}</p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Grounded Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {links.length > 0 ? links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-300 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-800">{link.title}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                </a>
              )) : (
                <p className="text-sm text-gray-400 italic">No direct maps links found in current context.</p>
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default StoresTab;
