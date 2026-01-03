
import React, { useState, useEffect } from 'react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';
import { fetchWeather, geocode } from '../services/weatherService';
import { getOutfitSuggestion, generateOutfitImage, generateWeatherHeroImage } from '../services/geminiService';
import { Search, Loader2, Thermometer, Wind, CloudRain, AlertCircle, Sparkles, Camera, Download, RefreshCw, CloudIcon, Sun, CloudLightning, Droplets } from 'lucide-react';

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
  currentOutfit 
}) => {
  const [locationInput, setLocationInput] = useState('Seattle');
  const [context, setContext] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contexts = ['casual', 'formal office', 'casual hike', 'night out', 'athletic'];

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
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!currentOutfit || !weather) return;
    setVisualizing(true);
    setError(null);
    try {
      const url = await generateOutfitImage(currentOutfit, weather, "1K", unit);
      onOutfitImageUpdate(url);
    } catch (err: any) {
      setError("Failed to render image.");
    } finally {
      setVisualizing(false);
    }
  };

  useEffect(() => {
    if (!currentOutfit && !weather) {
      handleGenerate();
    }
  }, []);

  const getDisplayTemp = (c: number) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);

  const getWeatherIcon = (precip: number, temp: number) => {
    if (precip > 5) return <CloudLightning className="w-6 h-6 text-yellow-400" />;
    if (precip > 0) return <Droplets className="w-6 h-6 text-blue-400" />;
    if (temp > 20) return <Sun className="w-6 h-6 text-orange-400" />;
    return <CloudIcon className="w-6 h-6 text-white" />;
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Climate Header - Fixed Aspect Ratio */}
      <div className="relative w-full aspect-[16/8] bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 shrink-0">
        {(weatherHero && !loading) ? (
          <>
            <img src={weatherHero} alt="Weather" className="w-full h-full object-cover brightness-[0.85]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/20">
                  {getWeatherIcon(weather!.precip, weather!.temp)}
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">{weather!.location}</span>
                </div>
              </div>
              <div className="text-white flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Current Climate</p>
                  <p className="text-4xl font-black tracking-tighter">{getDisplayTemp(weather!.temp)}°{unit}</p>
                </div>
                <div className="flex gap-3 pb-1">
                  <div className="text-center">
                    <p className="text-[8px] font-black opacity-60 uppercase">Wind</p>
                    <p className="text-xs font-black">{weather!.wind}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black opacity-60 uppercase">Precip</p>
                    <p className="text-xs font-black">{weather!.precip}m</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-widest">Building Forecast...</p>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
        <form onSubmit={handleGenerate} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city..."
              className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-100 outline-none text-xs font-bold transition-all"
            />
          </div>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="px-3 py-3 bg-gray-50 border border-transparent rounded-xl outline-none text-[10px] font-black uppercase tracking-tighter"
          >
            {contexts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            disabled={loading}
            className="bg-indigo-600 text-white p-3 rounded-xl disabled:bg-indigo-300 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase border border-red-100 animate-in fade-in">{error}</div>}

      {/* Suggestion Card */}
      {currentOutfit && weather && !loading && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest">Aura Recommendation</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <OutfitSmallItem label="Base" value={currentOutfit.baseLayer} />
              <OutfitSmallItem label="Outer" value={currentOutfit.outerwear} />
              <OutfitSmallItem label="Feet" value={currentOutfit.footwear} />
            </div>

            <div className="pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-600 font-medium leading-relaxed italic line-clamp-2">
                "{currentOutfit.proTip}"
              </p>
            </div>

            <button
              onClick={handleVisualize}
              disabled={visualizing}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              {visualizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              {outfitImage ? "Regenerate Visual" : "Visualize this Look"}
            </button>
          </div>

          {outfitImage && (
            <div className="aspect-[3/4] relative group">
              <img src={outfitImage} alt="Visual" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-6 flex justify-end">
                 <a href={outfitImage} download className="p-3 bg-white rounded-2xl text-indigo-600 shadow-xl"><Download className="w-5 h-5" /></a>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="h-4" /> {/* Spacer for scroll end */}
    </div>
  );
};

const OutfitSmallItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex gap-4 items-start">
    <span className="w-12 text-[9px] font-black text-indigo-300 uppercase mt-1 tracking-tighter shrink-0">{label}</span>
    <p className="flex-1 text-sm font-black text-gray-900 leading-tight">{value}</p>
  </div>
);

export default StylistTab;
