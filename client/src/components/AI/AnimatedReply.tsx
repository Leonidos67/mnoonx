import React, { useMemo } from 'react';
import BlurText from './BlurText';
import MarkdownContent from './MarkdownContent';

interface AnimatedReplyProps {
  content: string;
  animate?: boolean;
}

type TextBlock = {
  key: string;
  text: string;
  className: string;
  as: 'p' | 'span' | 'div';
};

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '');
}

function parseTextBlocks(content: string): TextBlock[] {
  const heading = 'text-neutral-900';
  const subheading = 'text-neutral-800';
  const listText = 'text-neutral-700 mb-1 last:mb-0';
  const bodyText =
    'text-neutral-700 mb-3 last:mb-0 w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]';
  const quoteText = 'text-amber-900/80 mb-1 last:mb-0 w-full';

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: TextBlock[] = [];
  let i = 0;
  let blockIndex = 0;

  const push = (block: Omit<TextBlock, 'key'>) => {
    blocks.push({ ...block, key: `blur-${blockIndex}` });
    blockIndex += 1;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || /^-{3,}$/.test(trimmed)) {
      i += 1;
      continue;
    }

    if (/^_(.+)_$/.test(trimmed) || /DYOR|financial advice|финансовой рекомендац/i.test(trimmed)) {
      push({
        text: stripMarkdownInline(trimmed),
        className: 'mt-3 text-[11px] leading-snug text-gray-400 mb-0 w-full',
        as: 'p',
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      push({
        text: stripMarkdownInline(trimmed.slice(4)),
        className: `mb-2 mt-3 text-base font-semibold ${subheading} first:mt-0 w-full`,
        as: 'p',
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      push({
        text: stripMarkdownInline(trimmed.slice(3)),
        className: `mb-2 mt-4 text-lg font-semibold ${heading} first:mt-0 w-full`,
        as: 'p',
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      push({
        text: stripMarkdownInline(trimmed.slice(2)),
        className: `mb-3 mt-4 text-xl font-bold ${heading} first:mt-0 w-full`,
        as: 'p',
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        push({
          text: stripMarkdownInline(lines[i].trim().slice(2)),
          className: `border-l-2 border-amber-400 pl-4 ${quoteText}`,
          as: 'p',
        });
        i += 1;
      }
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        push({
          text: stripMarkdownInline(lines[i].trim()),
          className: `list-disc pl-5 ${listText} w-full`,
          as: 'p',
        });
        i += 1;
      }
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        push({
          text: stripMarkdownInline(lines[i].trim()),
          className: `list-decimal pl-5 ${listText} w-full`,
          as: 'p',
        });
        i += 1;
      }
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

    push({
      text: stripMarkdownInline(paragraphLines.join(' ')),
      className: bodyText,
      as: 'p',
    });
  }

  return blocks;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const AnimatedReply: React.FC<AnimatedReplyProps> = ({ content, animate = true }) => {
  const blocks = useMemo(() => parseTextBlocks(content), [content]);
  const wordDelayMs = 20;
  const blockGapMs = 24;

  const delayOffsets = useMemo(() => {
    let offset = 0;
    return blocks.map((block) => {
      const current = offset;
      offset += countWords(block.text) * wordDelayMs + blockGapMs;
      return current;
    });
  }, [blocks]);

  if (!animate) {
    return (
      <MarkdownContent
        content={content}
        variant="light"
        className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]"
      />
    );
  }

  return (
    <div className="ai-markdown h-auto min-h-0 w-full min-w-0 max-w-full overflow-x-hidden text-[15px] leading-relaxed">
      {blocks.map((block, index) => (
        <BlurText
          key={block.key}
          text={block.text}
          delay={wordDelayMs}
          delayOffset={delayOffsets[index]}
          animateBy="words"
          direction="top"
          startImmediately
          stepDuration={0.16}
          className={block.className}
          as={block.as}
        />
      ))}
    </div>
  );
};

export default AnimatedReply;
