import React from 'react';

const BRAIN_RUSH_ICON_SRC = '/brand-assets/brain-rush-icon-v3.svg';

type BrainRushLogoIconProps = {
  className?: string;
};

export default function BrainRushLogoIcon({ className = '' }: BrainRushLogoIconProps) {
  return (
    <img
      className={className}
      src={BRAIN_RUSH_ICON_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
