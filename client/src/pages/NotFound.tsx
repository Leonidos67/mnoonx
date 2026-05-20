// pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">{t('notFound.title')}</p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;