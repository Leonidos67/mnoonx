import React from 'react';
import { useInAppBrowser } from '../../context/InAppBrowserContext';
import { normalizeExternalUrl } from '../../utils/externalLinks';

interface ExternalLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: React.ReactNode;
}

/**
 * Anchor that opens the in-app browser gate for http(s) URLs.
 */
const ExternalLink: React.FC<ExternalLinkProps> = ({
  href,
  children,
  onClick,
  className,
  ...rest
}) => {
  const { openExternalLink } = useInAppBrowser();
  const normalized = normalizeExternalUrl(href);
  const isInternalPath = href.startsWith('/') && !href.startsWith('//');

  if (isInternalPath || !normalized) {
    return (
      <a href={href} className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={normalized}
      className={className}
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        openExternalLink(normalized);
      }}
      {...rest}
    >
      {children}
    </a>
  );
};

export default ExternalLink;
