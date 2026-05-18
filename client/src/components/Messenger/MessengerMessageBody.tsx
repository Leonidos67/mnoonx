import React from 'react';
import AnimojiPlayer from './AnimojiPlayer';
import { isAnimojiOnlyMessage, parseMessageParts } from '../../utils/messengerAnimoji';

interface MessengerMessageBodyProps {
  text: string;
  className?: string;
}

const MessengerMessageBody: React.FC<MessengerMessageBodyProps> = ({ text, className = '' }) => {
  const parts = parseMessageParts(text);
  const animojiOnly = isAnimojiOnlyMessage(text);

  if (animojiOnly && parts[0]?.type === 'animoji') {
    const part = parts[0];
    return (
      <div className={className}>
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
    <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${className}`}>
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
  );
};

export default MessengerMessageBody;
