import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DocsLayout from './DocsLayout';
import DocsPage from './DocsPage';
import DocsSupportPage from './DocsSupportPage';
import { DOCS_DEFAULT_PATH } from '../../docs/docsNav';

const DocsRoutes: React.FC = () => (
  <Routes>
    <Route element={<DocsLayout />}>
      <Route index element={<Navigate to="start/overview" replace />} />
      <Route path="support/:ticketId" element={<DocsSupportPage />} />
      <Route path="support" element={<DocsSupportPage />} />
      <Route path=":section/:page" element={<DocsPage />} />
    </Route>
    <Route path="*" element={<Navigate to={DOCS_DEFAULT_PATH} replace />} />
  </Routes>
);

export default DocsRoutes;
