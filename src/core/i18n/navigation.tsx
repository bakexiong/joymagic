import React from 'react';
import { createNavigation } from 'next-intl/navigation';

import { routing } from './config';
import { isNonBrandExternal, mergeRelValues } from '@/shared/lib/url';

const { Link: IntlLink, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

type IntlLinkProps = React.ComponentProps<typeof IntlLink>;

export const Link = React.forwardRef<HTMLAnchorElement, IntlLinkProps>(
  function LinkWithNoFollow({ href, rel, ...props }, ref) {
    const needsNoFollow = typeof href === 'string' && isNonBrandExternal(href);
    const mergedRel = mergeRelValues(
      rel,
      needsNoFollow ? 'nofollow noopener noreferrer' : undefined
    );

    return (
      <IntlLink ref={ref} href={href} rel={mergedRel} {...props}>
        {props.children}
      </IntlLink>
    );
  }
);

export { redirect, usePathname, useRouter, getPathname };
