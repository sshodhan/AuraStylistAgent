
import React, { useState } from 'react';
import { Mail, Bell, Clock, Calendar, Smartphone, CheckCircle2 } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [sendTime, setSendTime] = useState("07:30");

  const handleSave = () => {
    // In a real app, this would save to a database/Firebase
    alert(`Preferences saved! You'll receive your styling brief at ${sendTime}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="text-indigo-600 w-5 h-5" />
          Proactive Styling
        </h2>
        <p className="text-sm text-gray-500">
          Don't wait to check the weather. Aura can send your outfit brief directly to your inbox or phone.
        </p>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Mail className="text-gray-400 w-5 h-5" />
              <div>
                <p className="font-semibold text-gray-800 text-sm">Daily Email Digest</p>
                <p className="text-xs text-gray-500">Full layout with shopping links</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={emailEnabled} 
              onChange={() => setEmailEnabled(!emailEnabled)}
              className="w-5 h-5 accent-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Smartphone className="text-gray-400 w-5 h-5" />
              <div>
                <p className="font-semibold text-gray-800 text-sm">Mobile Push Notification</p>
                <p className="text-xs text-gray-500">Quick outfit preview</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={pushEnabled} 
              onChange={() => setPushEnabled(!pushEnabled)}
              className="w-5 h-5 accent-indigo-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Clock className="text-indigo-600 w-5 h-5" />
          Schedule
        </h3>
        <div className="flex gap-4 items-center">
          <input 
            type="time" 
            value={sendTime}
            onChange={(e) => setSendTime(e.target.value)}
            className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          <button 
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
        <div className="flex gap-3">
          <Calendar className="text-indigo-600 shrink-0" />
          <div className="space-y-2">
            <h4 className="font-bold text-indigo-900 text-sm">Next Level: Smart Calendar Sync</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              If enabled, Aura will scan your Google Calendar for keywords like "Wedding", "Gym", or "Interview" to automatically adjust your daily context.
            </p>
            <button className="text-xs font-bold text-indigo-600 underline">Connect Calendar</button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-xl flex items-start gap-3">
        <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0" />
        <p className="text-xs text-green-800">
          <strong>Android App Mode:</strong> This app is currently PWA-enabled. You can select "Add to Home Screen" in your mobile browser to run Aura as a full-screen app.
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;
