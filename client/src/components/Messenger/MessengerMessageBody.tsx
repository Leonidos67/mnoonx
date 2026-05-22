import React from 'react';
import AnimojiPlayer from './AnimojiPlayer';
import {
  formatMessagePreview,
  getMessageBody,
  isAnimojiOnlyMessage,
  isStickerOnlyMessage,
  parseMessageParts,
  splitReplyMessage,
} from '../../utils/messengerAnimoji';

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

  const quoteLabel =
    quoteBlock &&
    quoteBlock
      .split('\n')
      .map((line) => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();

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
          if (!part.value) return null;
          return <span key={`text-${index}`}>{part.value}</span>;
        })}
      </p>
    </div>
  );
};

export default MessengerMessageBody;
