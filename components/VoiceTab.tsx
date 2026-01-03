
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { WeatherData, TempUnit } from '../types';
import { encode, decode, decodeAudioData } from '../services/geminiService';
import { Mic, MicOff, Volume2, Loader2, Info } from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  unit: TempUnit;
}

const VoiceTab: React.FC<Props> = ({ weather, unit }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev.slice(-10), `Stylist: ${text}`]);
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: `You are Aura, a friendly and chic fashion stylist. 
            ${weather ? `The current weather in ${weather.location} is ${unit === 'F' ? (weather.temp * 9/5 + 32).toFixed(1) : weather.temp.toFixed(1)}°${unit}, ${weather.wind}km/h wind, and ${weather.precip}mm rain.` : ''}
            Talk to the user naturally about their outfit concerns. Use °${unit} when mentioning temperatures. Keep responses brief and helpful.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsConnected(false);
  };

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col items-center justify-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Volume2 className="w-32 h-32" />
        </div>
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isConnected ? 'bg-white shadow-[0_0_50px_rgba(255,255,255,0.5)] scale-110' : 'bg-indigo-500'}`}>
          {isConnected ? <Mic className="text-indigo-600 w-10 h-10" /> : <MicOff className="text-indigo-200 w-10 h-10" />}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{isConnected ? "Aura is Listening" : "Start a Conversation"}</h2>
          <p className="text-indigo-100 text-sm max-w-xs">Ask for style advice in real-time using °{unit} units.</p>
        </div>

        <button
          onClick={isConnected ? stopSession : startSession}
          disabled={isConnecting}
          className={`px-8 py-3 rounded-full font-bold transition-all ${
            isConnected 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white text-indigo-600 hover:bg-indigo-50'
          } disabled:opacity-50`}
        >
          {isConnecting ? <Loader2 className="animate-spin" /> : (isConnected ? "End Call" : "Connect with Stylist")}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border p-6 space-y-4">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest border-b pb-2">
          <Info className="w-4 h-4" />
          Live Transcript
        </div>
        <div className="h-48 overflow-y-auto space-y-2 text-sm">
          {transcription.length === 0 ? (
            <p className="text-gray-300 italic">No activity yet...</p>
          ) : (
            transcription.map((t, i) => (
              <p key={i} className="text-gray-700 animate-in fade-in slide-in-from-left-2">{t}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceTab;
