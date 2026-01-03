
import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle2, Eye, Loader2, X, Sparkles, User, AlertCircle, ChevronRight, Copy, ExternalLink, Send, Code, Terminal, Server, Globe, ShieldCheck } from 'lucide-react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';
import { generateEmailDigest, getOutfitSuggestion } from '../services/geminiService';
import { fetchWeather, geocode } from '../services/weatherService';
import { sendRealEmail } from '../services/backendService';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  unit: TempUnit;
}

const SettingsTab: React.FC<Props> = ({ weather, outfit, unit }) => {
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('aura_email_address') || "");
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('aura_email_enabled') === 'true');
  const [sendTime, setSendTime] = useState(() => localStorage.getItem('aura_send_time') || "07:30");
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [digestContent, setDigestContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    localStorage.setItem('aura_email_address', emailAddress);
    localStorage.setItem('aura_email_enabled', String(emailEnabled));
    localStorage.setItem('aura_send_time', sendTime);
  }, [emailAddress, emailEnabled, sendTime]);

  const handleManualSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setIsGenerating(true);
    setDeliveryStatus('idle');
    setErrorMessage(null);
    try {
      let currentOutfit = outfit;
      let currentWeather = weather;
      if (!currentWeather) {
        const coords = await geocode('Seattle');
        if (coords) currentWeather = await fetchWeather(coords.lat, coords.lon, 'Seattle');
      }
      if (currentWeather && !currentOutfit) {
        currentOutfit = await getOutfitSuggestion(currentWeather, 'professional', unit);
      }
      if (currentWeather && currentOutfit) {
        const content = await generateEmailDigest(currentWeather, currentOutfit, unit);
        setDigestContent(content);
      }
    } catch (err) {
      setDigestContent("Could not generate brief. Check API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLiveSend = async () => {
    if (!digestContent || !emailAddress) return;
    setIsSending(true);
    setErrorMessage(null);
    const result = await sendRealEmail(emailAddress, "Aura Daily Style Briefing", digestContent);
    setIsSending(false);
    if (result.success) {
      setDeliveryStatus('success');
    } else {
      setDeliveryStatus('error');
      setErrorMessage(result.error || "Check /api/send-email exists.");
    }
  };

  const handleCopy = () => {
    if (digestContent) {
      navigator.clipboard.writeText(digestContent);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Vercel Integration Header */}
      <div className="mx-4 p-5 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-indigo-200" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Live Integration</h2>
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest">Vercel Backend</h2>
            <p className="text-[10px] opacity-80 font-medium">Email delivery via Resend active.</p>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <button 
          onClick={() => setShowGuide(true)}
          className="w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <Terminal className="w-4 h-4" />
          Setup Vercel Key
        </button>
      </div>

      {/* Identity Group */}
      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</h3>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1">Styling Address</p>
              <input 
                type="email" 
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="fashion@aura.com"
                className="w-full bg-transparent border-none outline-none text-sm font-black text-gray-900 p-0" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Automation Group */}
      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Automation</h3>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
          <SettingToggle 
            icon={<Mail className="w-4 h-4" />} 
            label="Live Daily Delivery" 
            checked={emailEnabled} 
            onChange={setEmailEnabled} 
          />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-xl text-gray-400"><Clock className="w-4 h-4" /></div>
              <span className="text-xs font-black text-gray-900 uppercase">Dispatch Time</span>
            </div>
            <input 
              type="time" 
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="bg-gray-100 border-none rounded-lg px-2 py-1 text-xs font-black outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Actions Group */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handlePreview}
          className="w-full p-5 bg-white border border-gray-100 text-gray-900 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-widest">Send Live Test</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={handleManualSave}
          disabled={saveStatus !== 'idle'}
          className="w-full p-5 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className={`w-5 h-5 ${saveStatus === 'saved' ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-xs font-black uppercase tracking-widest">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Preferences Active' : 'Update Preferences'}
            </span>
          </div>
          {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
        </button>
      </div>

      {/* Personalized Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <Terminal className="text-indigo-600 w-5 h-5" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Vercel Integration</h3>
              </div>
              <button onClick={() => setShowGuide(false)} className="p-2 bg-white rounded-full shadow-sm">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="p-5 bg-indigo-600 rounded-3xl text-white space-y-3 shadow-lg">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Your Resend Key Detected</p>
                <div className="bg-black/20 p-3 rounded-xl font-mono text-[9px] break-all">
                  re_bGKQVep3_9iNj...
                </div>
                <p className="text-[11px] font-medium leading-relaxed">
                  I have configured the backend to use your key. Follow these final steps to go live:
                </p>
              </div>

              <Step number={1} title="Set Environment Variable" desc="Go to Vercel Settings > Environment Variables." />
              
              <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vercel Config</span>
                  <Copy className="w-3 h-3 text-gray-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-600 uppercase">Key:</p>
                  <p className="text-[11px] font-mono text-indigo-600 bg-white p-2 rounded-lg border border-gray-100">RESEND_API_KEY</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-600 uppercase">Value:</p>
                  <p className="text-[11px] font-mono text-indigo-600 bg-white p-2 rounded-lg border border-gray-100 truncate">re_bGKQVep3_9iNj9peMkh15gphJUdWHYPNt</p>
                </div>
              </div>
              
              <Step number={2} title="Verify API Path" desc="The file /api/send-email.ts is already in your project root." />
              <Step number={3} title="Push & Redeploy" desc="Commit your changes and push to GitHub. Vercel will handle the rest." />
              
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex gap-3">
                 <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                 <p className="text-[10px] text-green-700 font-bold leading-relaxed">
                   After redeploying, the "Send Live Test" button will start dispatching real emails to your Styling Address.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {isPreviewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[85dvh]">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-600 w-5 h-5" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Dispatch Center</h3>
              </div>
              <button onClick={() => setIsPreviewing(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/20 custom-scrollbar">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Syncing Styles...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {deliveryStatus !== 'idle' && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 ${
                      deliveryStatus === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                      {deliveryStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          {deliveryStatus === 'success' ? 'Briefing Dispatched' : 'API Error'}
                        </p>
                        {deliveryStatus === 'error' && <p className="text-[8px] font-medium mt-0.5 opacity-70">{errorMessage}</p>}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-xs font-medium leading-loose whitespace-pre-wrap italic text-gray-600 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 opacity-20" />
                    {digestContent}
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleLiveSend}
                      disabled={isSending || deliveryStatus === 'success'}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:bg-gray-200 disabled:shadow-none"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {deliveryStatus === 'success' ? "Message Delivered" : "Send Real Briefing"}
                    </button>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopy}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        {copyStatus ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copyStatus ? "Copied" : "Copy Content"}
                      </button>
                      <a
                        href={`mailto:${emailAddress}?subject=Aura Style Briefing&body=${encodeURIComponent(digestContent || '')}`}
                        className="flex-1 py-4 bg-gray-100 text-gray-600 border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Draft Mail
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Step: React.FC<{ number: number, title: string, desc: string }> = ({ number, title, desc }) => (
  <div className="flex gap-4">
    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">{number}</div>
    <div className="space-y-1">
      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wide">{title}</h4>
      <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
    </div>
  </div>
);

const SettingToggle: React.FC<{ icon: React.ReactNode, label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ icon, label, checked, onChange }) => (
  <div className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${checked ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300'}`}>{icon}</div>
      <span className="text-xs font-black text-gray-900 uppercase">{label}</span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer scale-[0.8]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
  </div>
);

export default SettingsTab;
