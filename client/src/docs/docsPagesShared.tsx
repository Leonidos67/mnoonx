import React from 'react';
import { Link } from 'react-router-dom';
import type { DocsArticleProps } from '../components/Docs/DocsArticle';

export const DocsLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link to={to} className="font-medium text-[#315efb] hover:underline">
    {children}
  </Link>
);

export const DocsCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[13px] font-medium text-neutral-700">
    {children}
  </code>
);

export const DocsUl: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="mt-2 list-disc space-y-1.5 pl-5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export type DocsPageKey = `${string}/${string}`;

export type DocsPageContent = Omit<DocsArticleProps, 'prev' | 'next'>;
