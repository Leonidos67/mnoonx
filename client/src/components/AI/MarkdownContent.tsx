import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
  variant?: 'light' | 'dark';
}

const lightInline = {
  strong: 'font-semibold text-neutral-800',
  code: 'rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-amber-800',
  link: 'text-[#315efb] underline-offset-2 hover:underline',
};

const darkInline = {
  strong: 'font-semibold text-neutral-100',
  code: 'rounded bg-white/10 px-1.5 py-0.5 text-sm text-amber-200',
  link: 'text-[#6ea8ff] underline-offset-2 hover:underline',
};

function renderInline(
  text: string,
  keyPrefix: string,
  variant: 'light' | 'dark'
): React.ReactNode[] {
  const styles = variant === 'light' ? lightInline : darkInline;
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const id = `${keyPrefix}-inline-${i}`;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={id} className={styles.strong}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={id} className={styles.code}>
          {token.slice(1, -1)}
        </code>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={id}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
    i += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : [text];
}

function renderBlocks(content: string, variant: 'light' | 'dark'): React.ReactNode[] {
  const heading = variant === 'light' ? 'text-neutral-900' : 'text-white';
  const subheading = variant === 'light' ? 'text-neutral-800' : 'text-neutral-100';
  const listText = variant === 'light' ? 'text-neutral-700' : 'text-neutral-300';
  const quoteBorder = variant === 'light' ? 'border-amber-400 text-amber-900/80' : 'border-amber-500/60 text-amber-100/90';
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockIndex = 0;

  const pushBlock = (node: React.ReactNode) => {
    blocks.push(<React.Fragment key={`block-${blockIndex}`}>{node}</React.Fragment>);
    blockIndex += 1;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      i += 1;
      continue;
    }

    if (/^_(.+)_$/.test(trimmed) || /DYOR|financial advice|финансовой рекомендац/i.test(trimmed)) {
      const disclaimerText = trimmed.replace(/^_(.+)_$/, '$1');
      pushBlock(
        <p className="mt-3 text-[11px] leading-snug text-gray-400">{disclaimerText}</p>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      pushBlock(
        <h4 className={`mb-2 mt-3 text-base font-semibold ${subheading} first:mt-0`}>
          {renderInline(trimmed.slice(4), `h3-${blockIndex}`, variant)}
        </h4>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      pushBlock(
        <h3 className={`mb-2 mt-4 text-lg font-semibold ${heading} first:mt-0`}>
          {renderInline(trimmed.slice(3), `h2-${blockIndex}`, variant)}
        </h3>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      pushBlock(
        <h2 className={`mb-3 mt-4 text-xl font-bold ${heading} first:mt-0`}>
          {renderInline(trimmed.slice(2), `h1-${blockIndex}`, variant)}
        </h2>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i += 1;
      }
      pushBlock(
        <blockquote className={`my-3 border-l-2 pl-4 ${quoteBorder}`}>
          {quoteLines.map((q, qi) => (
            <p key={`q-${blockIndex}-${qi}`} className="mb-1 last:mb-0">
              {renderInline(q, `quote-${blockIndex}-${qi}`, variant)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      pushBlock(
        <ul className="mb-3 list-disc space-y-1 pl-5">
          {items.map((item, li) => (
            <li key={`ul-${blockIndex}-${li}`} className={listText}>
              {renderInline(item, `ul-${blockIndex}-${li}`, variant)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      pushBlock(
        <ol className="mb-3 list-decimal space-y-1 pl-5">
          {items.map((item, li) => (
            <li key={`ol-${blockIndex}-${li}`} className={listText}>
              {renderInline(item, `ol-${blockIndex}-${li}`, variant)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next.startsWith('#') ||
        next.startsWith('> ') ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }

    pushBlock(
      <p className="mb-3 min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap last:mb-0">
        {renderInline(paragraphLines.join(' '), `p-${blockIndex}`, variant)}
      </p>
    );
  }

  return blocks;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = '',
  variant = 'light',
}) => {
  const textColor = variant === 'light' ? 'text-neutral-700' : 'text-neutral-200';
  return (
    <div
      className={`ai-markdown min-w-0 w-full max-w-full overflow-x-hidden text-[15px] leading-relaxed ${textColor} ${className}`}
    >
      {renderBlocks(content, variant)}
    </div>
  );
};

export default MarkdownContent;
