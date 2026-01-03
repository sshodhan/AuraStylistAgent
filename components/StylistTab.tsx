
import React, { useState, useEffect } from 'react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';
import { fetchWeather, geocode } from '../services/weatherService';
import { getOutfitSuggestion, generateOutfitImage } from '../services/geminiService';
import { Search, Loader2, Thermometer, Wind, CloudRain, AlertCircle, Sparkles, Camera, Download, RefreshCw } from 'lucide-react';

interface Props {
  unit: TempUnit;
  onWeatherUpdate: (w: WeatherData) => void;
  onOutfitUpdate: (o: OutfitSuggestion) => void;
  currentOutfit: OutfitSuggestion | null;
}

const StylistTab: React.FC<Props> = ({ unit, onWeatherUpdate, onOutfitUpdate, currentOutfit }) => {
  const [locationInput, setLocationInput] = useState('Seattle');
  const [context, setContext] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherData | null>(null);

  const contexts = ['casual', 'formal office', 'casual hike', 'night out', 'athletic'];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setOutfitImage(null);

    try {
      const coords = await geocode(locationInput);
      if (!coords) throw new Error("Could not find location.");

      const weather = await fetchWeather(coords.lat, coords.lon, locationInput);
      setWeatherInfo(weather);
      onWeatherUpdate(weather);

      const suggestion = await getOutfitSuggestion(weather, context, unit);
      onOutfitUpdate(suggestion);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!currentOutfit || !weatherInfo) return;

    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setVisualizing(true);
    setError(null);
    try {
      const url = await generateOutfitImage(currentOutfit, weatherInfo, "1K", unit);
      setOutfitImage(url);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Please re-select your API key with a paid project.");
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
          await (window as any).aistudio.openSelectKey();
        }
      } else {
        setError("Failed to generate image. Ensure you've selected an API key from a paid project.");
      }
    } finally {
      setVisualizing(false);
    }
  };

  useEffect(() => {
    if (!currentOutfit) handleGenerate();
  }, []);

  const getDisplayTemp = (c: number) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Where are you heading?</h2>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter city..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {contexts.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <button
            disabled={loading}
            className="md:col-span-2 w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Plan My Outfit"}
          </button>
        </form>
      </section>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {currentOutfit && weatherInfo && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <WeatherCard icon={<Thermometer />} label="Temp" value={`${getDisplayTemp(weatherInfo.temp)}°${unit}`} />
            <WeatherCard icon={<CloudRain />} label="Precip" value={`${weatherInfo.precip}mm`} />
            <WeatherCard icon={<Wind />} label="Wind" value={`${weatherInfo.wind}km/h`} />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="md:grid md:grid-cols-2">
              <div className="p-8 bg-indigo-50/50 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Stylist Verdict</h3>
                  <h4 className="text-3xl font-bold text-gray-900 leading-tight">Your Suggested Look</h4>
                </div>
                
                <div className="space-y-6">
                  <OutfitItem label="Base Layer" value={currentOutfit.baseLayer} />
                  <OutfitItem label="Outerwear" value={currentOutfit.outerwear} />
                  <OutfitItem label="Footwear" value={currentOutfit.footwear} />
                </div>

                <div className="pt-6 border-t border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Aura's Style Logic</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    {currentOutfit.styleReasoning}
                  </p>
                </div>
              </div>

              <div className="bg-gray-100 min-h-[400px] relative overflow-hidden group">
                {outfitImage ? (
                  <>
                    <img src={outfitImage} alt="Outfit preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button 
                        onClick={handleVisualize}
                        disabled={visualizing}
                        className="p-3 bg-white/90 backdrop-blur rounded-full text-indigo-600 shadow-lg hover:bg-white transition-colors"
                        title="Regenerate Look"
                      >
                        <RefreshCw className={`w-5 h-5 ${visualizing ? 'animate-spin' : ''}`} />
                      </button>
                      <a 
                        href={outfitImage} 
                        download="aura-style.png"
                        className="p-3 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-colors"
                        title="Download Look"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gradient-to-br from-gray-50 to-gray-200">
                    {visualizing ? (
                      <>
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-900 font-bold">Generating Editorial Visual...</p>
                          <p className="text-xs text-gray-500">Consulting Gemini 3 Pro Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-5 bg-white rounded-full shadow-inner">
                          <Camera className="w-10 h-10 text-gray-300" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-600 font-medium">Visualize this recommendation</p>
                          <p className="text-xs text-gray-400 max-w-[200px] mx-auto">See how this outfit looks in {weatherInfo.location}'s current climate</p>
                        </div>
                        <button
                          onClick={handleVisualize}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Preview
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
               <div className="bg-indigo-600 p-2 rounded-lg text-white">
                 <Sparkles className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pro Stylist Tip</p>
                 <p className="text-sm text-gray-800 font-medium leading-tight">"{currentOutfit.proTip}"</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WeatherCard: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-1 transition-all hover:border-indigo-100">
    <div className="text-indigo-500">{icon}</div>
    <span className="text-[10px] text-gray-400 uppercase font-semibold">{label}</span>
    <span className="font-bold text-gray-800 whitespace-nowrap">{value}</span>
  </div>
);

const OutfitItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{label}</span>
    <p className="text-lg text-gray-900 font-semibold leading-snug">{value || 'Not needed'}</p>
  </div>
);

export default StylistTab;
