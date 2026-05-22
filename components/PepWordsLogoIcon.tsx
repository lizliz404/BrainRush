import type { ImgHTMLAttributes } from 'react';

const PEP_WORDS_LOGO_SRC = '/pep-words-logo.svg';

type PepWordsLogoIconProps = ImgHTMLAttributes<HTMLImageElement>;

export default function PepWordsLogoIcon({ alt = '', className = '', ...props }: PepWordsLogoIconProps) {
  return (
    <img
      {...props}
      src={PEP_WORDS_LOGO_SRC}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      className={className}
      draggable={false}
    />
  );
}
