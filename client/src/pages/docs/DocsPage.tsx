import React from 'react';
import { Link, useParams } from 'react-router-dom';
import DocsArticle from '../../components/Docs/DocsArticle';
import { getDocsPageContent } from '../../docs/docsPages';
import {
  DOCS_DEFAULT_PATH,
  findDocsNavItem,
  findDocsSection,
  getAdjacentDocsPages,
} from '../../docs/docsNav';

const DocsPage: React.FC = () => {
  const { section, page } = useParams<{ section: string; page: string }>();
  const sectionId = section || '';
  const pageSlug = page || '';

  const navItem = findDocsNavItem(sectionId, pageSlug);
  const content = getDocsPageContent(sectionId, pageSlug);
  const { prev, next } = getAdjacentDocsPages(sectionId, pageSlug);

  if (!navItem || !content) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Страница не найдена</h1>
        <p className="mt-2 text-neutral-500">Раздел документации не существует.</p>
        <Link
          to={DOCS_DEFAULT_PATH}
          className="mt-6 inline-block rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          К началу документации
        </Link>
      </div>
    );
  }

  const sectionMeta = findDocsSection(sectionId);

  return (
    <DocsArticle
      {...content}
      breadcrumbSection={sectionMeta?.sidebarLabel}
      prev={prev}
      next={next}
    />
  );
};

export default DocsPage;
