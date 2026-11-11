import React from 'react';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { isNonBrandExternal, mergeRelValues } from '@/shared/lib/url';

// Custom link component with nofollow for external links
const CustomLink = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const needsNoFollow = isNonBrandExternal(href);
  const relValue = mergeRelValues(
    props.rel,
    needsNoFollow ? 'nofollow noopener noreferrer' : undefined
  );

  const finalProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    ...props,
    rel: relValue,
    target: needsNoFollow ? props.target || '_blank' : props.target,
  };

  if (needsNoFollow) {
    return (
      <a href={href} {...finalProps}>
        {children}
      </a>
    );
  }

  // Internal links
  return (
    <a href={href} {...finalProps}>
      {children}
    </a>
  );
};

// Higher-order component to wrap any link component with nofollow logic
export function withNoFollow(
  LinkComponent: React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement>
  >
) {
  return ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const needsNoFollow = isNonBrandExternal(href);
    const relValue = mergeRelValues(
      props.rel,
      needsNoFollow ? 'nofollow noopener noreferrer' : undefined
    );

    const finalProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
      ...props,
      rel: relValue,
      target: needsNoFollow ? props.target || '_blank' : props.target,
    };

    if (needsNoFollow) {
      return (
        <LinkComponent href={href} {...finalProps}>
          {children}
        </LinkComponent>
      );
    }

    // For internal links, just use the wrapped component as-is
    return (
      <LinkComponent href={href} {...finalProps}>
        {children}
      </LinkComponent>
    );
  };
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  const mergedComponents = {
    ...defaultMdxComponents,
    a: CustomLink,
    ...components,
  };

  // If a custom 'a' component is provided, wrap it with nofollow logic
  if (components?.a && components.a !== CustomLink) {
    mergedComponents.a = withNoFollow(
      components.a as React.ComponentType<
        React.AnchorHTMLAttributes<HTMLAnchorElement>
      >
    );
  }

  return mergedComponents;
}

// This export is required for Next.js MDX support
export default getMDXComponents;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
