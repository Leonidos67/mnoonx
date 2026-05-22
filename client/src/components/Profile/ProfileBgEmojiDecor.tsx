import React from 'react';
import { PROFILE_BG_EMOJI_POSITIONS } from '../../constants/profileCustomization';

interface ProfileBgEmojiDecorProps {
  emoji: string;
}

const ProfileBgEmojiDecor: React.FC<ProfileBgEmojiDecorProps> = ({ emoji }) => {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(52%,220px)]"
      aria-hidden
    >
      {PROFILE_BG_EMOJI_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className="absolute select-none leading-none"
          style={{
            top: pos.top,
            right: pos.right,
            fontSize: pos.size,
            opacity: pos.opacity,
            transform: `rotate(${pos.rotate}deg)`,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

export default ProfileBgEmojiDecor;
