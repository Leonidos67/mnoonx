import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AnimojiPlayer from './AnimojiPlayer';
import MessengerCoinMessageCard from './MessengerCoinMessageCard';
import MessengerLinkPreviewCard from './MessengerLinkPreviewCard';
import ExternalLink from '../Common/ExternalLink';
import {
  formatMessagePreview,
  getMessageBody,
  isAnimojiOnlyMessage,
  isCoinOnlyMessage,
  isStickerOnlyMessage,
  parseMessageParts,
  splitReplyMessage,
} from '../../utils/messengerAnimoji';

/** Absolute http(s) or in-app absolute paths (/settings, /docs/…). */
const LINK_RE = /(https?:\/\/[^\s<]+|\/(?:[a-zA-Z0-9@][\w\-./?=&%#@]*))/g;

function extractFirstUrl(text: string): string | null {
  const match = text.match(/(https?:\/\/[^\s<]+)/);
  if (!match || match.length === 0) return null;
  return match[0].replace(/[).,!?]+$/, '');
}

function renderTextWithLinks(value: string, keyPrefix: string): React.ReactNode[] {
  if (!value) return [];
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  const re = new RegExp(LINK_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-t-${index}`}>
          {value.slice(lastIndex, match.index)}
        </React.Fragment>
      );
      index += 1;
    }
    const rawUrl = match[0].replace(/[).,!?]+$/, '');
    const trailing = match[0].slice(rawUrl.length);
    if (rawUrl.startsWith('/')) {
      nodes.push(
        <Link
          key={`${keyPrefix}-a-${index}`}
          to={rawUrl}
          onClick={(e) => e.stopPropagation()}
          className="underline decoration-current/40 underline-offset-2 hover:opacity-80 break-all"
        >
          {rawUrl}
        </Link>
      );
    } else {
      nodes.push(
        <ExternalLink
          key={`${keyPrefix}-a-${index}`}
          href={rawUrl}
          onClick={(e) => e.stopPropagation()}
          className="underline decoration-current/40 underline-offset-2 hover:opacity-80 break-all"
        >
          {rawUrl}
        </ExternalLink>
      );
    }
    index += 1;
    if (trailing) {
      nodes.push(
        <React.Fragment key={`${keyPrefix}-tt-${index}`}>{trailing}</React.Fragment>
      );
      index += 1;
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < value.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-t-${index}`}>{value.slice(lastIndex)}</React.Fragment>
    );
  }
  return nodes;
}

interface MessengerMessageBodyProps {
  text: string;
  className?: string;
  quoteClassName?: string;
}

const MessengerMessageBody: React.FC<MessengerMessageBodyProps> = ({
  text,
  className = '',
  quoteClassName = 'mb-2 border-l-2 border-current/25 pl-2 text-xs opacity-75',
}) => {
  const { quoteBlock, body } = splitReplyMessage(text);
  const displayText = quoteBlock ? body : text;
  const parts = parseMessageParts(displayText);
  const animojiOnly = isAnimojiOnlyMessage(displayText);
  const stickerOnly = isStickerOnlyMessage(displayText);
  const coinOnly = isCoinOnlyMessage(displayText);

  const quoteLabel =
    quoteBlock &&
    quoteBlock
      .split('\n')
      .map((line) => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();

  const firstUrl = useMemo(() => {
    if (animojiOnly || stickerOnly || coinOnly) return null;
    return extractFirstUrl(displayText);
  }, [displayText, animojiOnly, stickerOnly, coinOnly]);

  if (animojiOnly && parts[0]?.type === 'animoji') {
    const part = parts[0];
    return (
      <div className={className}>
        {quoteLabel ? (
          <p className={`line-clamp-2 ${quoteClassName}`}>{formatMessagePreview(quoteLabel)}</p>
        ) : null}
        <AnimojiPlayer
          emoji={part.emoji}
          lottieUrl={part.lottieUrl}
          animojiId={part.id}
          slug={part.slug}
          size={72}
        />
      </div>
    );
  }

  if (stickerOnly && parts[0]?.type === 'sticker') {
    const part = parts[0];
    return (
      <div className={className}>
        {quoteLabel ? (
          <p className={`line-clamp-2 ${quoteClassName}`}>{formatMessagePreview(quoteLabel)}</p>
        ) : null}
        <img
          src={part.imageUrl}
          alt=""
          className="block h-[200px] w-[200px] object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (coinOnly && parts[0]?.type === 'coin') {
    const part = parts[0];
    return (
      <div className={className}>
        {quoteLabel ? (
          <p className={`line-clamp-2 ${quoteClassName}`}>{formatMessagePreview(quoteLabel)}</p>
        ) : null}
        <MessengerCoinMessageCard coin={part} />
      </div>
    );
  }

  return (
    <div className={className}>
      {quoteLabel ? (
        <p className={`line-clamp-2 ${quoteClassName}`}>{formatMessagePreview(quoteLabel)}</p>
      ) : null}
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {parts.map((part, index) => {
          if (part.type === 'animoji') {
            return (
              <span
                key={`animoji-${index}`}
                className="mx-0.5 inline-flex shrink-0 align-middle"
              >
                <AnimojiPlayer
                  emoji={part.emoji}
                  lottieUrl={part.lottieUrl}
                  animojiId={part.id}
                  slug={part.slug}
                  size={32}
                />
              </span>
            );
          }
          if (part.type === 'sticker') {
            return (
              <img
                key={`sticker-${index}`}
                src={part.imageUrl}
                alt=""
                className="inline-block h-24 w-24 align-middle object-contain"
                draggable={false}
              />
            );
          }
          if (part.type === 'coin') {
            return (
              <span key={`coin-${index}`} className="my-1 block">
                <MessengerCoinMessageCard coin={part} compact />
              </span>
            );
          }
          if (!part.value) return null;
          return (
            <span key={`text-${index}`}>{renderTextWithLinks(part.value, `text-${index}`)}</span>
          );
        })}
      </p>
      {firstUrl ? <MessengerLinkPreviewCard url={firstUrl} /> : null}
    </div>
  );
};

export default MessengerMessageBody;
