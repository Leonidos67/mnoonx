import React from 'react';
import {
  getProfileHeaderBackgroundStyle,
  type ProfileBgMode,
} from '../../constants/profileCustomization';

interface ProfileHeaderBackgroundProps {
  mode: ProfileBgMode;
  color1: string;
  color2: string;
  className?: string;
}

/** Full-bleed layer behind profile header content (gradient/solid + white fade BL→TR). */
const ProfileHeaderBackground: React.FC<ProfileHeaderBackgroundProps> = ({
  mode,
  color1,
  color2,
  className = '',
}) => {
  const style = getProfileHeaderBackgroundStyle(mode, color1, color2);
  if (!style.backgroundImage) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={style}
      aria-hidden
    />
  );
};

export default ProfileHeaderBackground;
