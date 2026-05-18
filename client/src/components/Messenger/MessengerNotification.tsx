// components/MessengerNotification.tsx
import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MessengerNotification: React.FC = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if welcome message hasn't been shown
    const welcomeShown = localStorage.getItem('welcomeNotificationShown');
    
    if (!welcomeShown) {
      // Show notification after 2 seconds
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem('welcomeNotificationShown', 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 w-80 overflow-hidden">
        <div className="bg-black text-white px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-semibold text-sm">New Message</span>
          </div>
          <button onClick={() => setShow(false)} className="hover:bg-white/10 rounded p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <img 
              src="https://ui-avatars.com/api/?background=6366f1&color=fff&name=WS" 
              alt="Support" 
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">MNOONX's support chat</p>
              <p className="text-sm text-neutral-600 mt-1">
                Hey MakTraxer! Welcome to MNOONX! 🎉
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShow(false);
              navigate('/messenger');
            }}
            className="mt-3 w-full bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Open Messenger
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessengerNotification;