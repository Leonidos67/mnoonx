import React from 'react';
import AnimojiPlayer from './AnimojiPlayer';
import {
  formatMessagePreview,
  getMessageBody,
  isAnimojiOnlyMessage,
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
          if (!part.value) return null;
          return <span key={`text-${index}`}>{part.value}</span>;
        })}
      </p>
    </div>
  );
};

export default MessengerMessageBody;
