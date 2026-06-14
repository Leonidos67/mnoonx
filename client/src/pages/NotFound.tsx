// pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="max-w-md mx-auto text-center w-full">
        
        <img src="https://i.ibb.co/bMCm7Yjh/image.png" alt="404 Not Found" className="w-full max-w-sm mx-auto mb-8" />
        
        <div className="mb-8 space-y-3 font-['Playfair_Display', 'Georgia', serif]">
          <p className="text-left text-gray-700 text-lg italic">
            <span className="text-gray-400 not-italic">—</span> {t('notFound.message1')} ?
          </p>
          <p className="text-right text-gray-700 text-lg italic">
            {t('notFound.message2')} . <span className="text-gray-400 not-italic">—</span>
          </p>
          <p className="text-left text-gray-700 text-lg italic">
            <span className="text-gray-400 not-italic">—</span> {t('notFound.message3')}
          </p>
          <p className="text-right text-gray-700 text-lg italic">
            {t('notFound.message4')} . <span className="text-gray-400 not-italic">—</span>
          </p>
          <p className="text-left text-gray-700 text-lg italic">
            <span className="text-gray-400 not-italic">—</span> {t('notFound.message5')}
          </p>
          <p className="text-right text-gray-700 text-lg italic">
            {t('notFound.message6')} . <span className="text-gray-400 not-italic">—</span>
          </p>
          <p className="text-left text-gray-700 text-lg italic">
            <span className="text-gray-400 not-italic">—</span> {t('notFound.message7')}
          </p>
          <p className="text-right text-gray-700 text-lg italic">
            {t('notFound.message8')} . <span className="text-gray-400 not-italic">—</span>
          </p>
        </div>
        
        <Link 
          to="/" 
          className="flex items-center font-bold justify-center gap-2 w-full px-8 py-3 bg-black text-white rounded-none transition-colors"
        >
          {/* <Home className="w-5 h-5" /> */}
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;