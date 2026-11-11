'use client';

import { TOCItems, TOCProvider } from 'fumadocs-ui/components/layout/toc';
import { CalendarIcon, ListIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { MarkdownPreview } from '@/shared/blocks/common';
import { Crumb } from '@/shared/blocks/common/crumb';
import { type Post as PostType } from '@/shared/types/blocks/blog';
import { NavItem } from '@/shared/types/blocks/common';

import '@/config/style/docs.css';

export function BlogDetail({
  post,
  relatedPosts = [],
  locale,
}: {
  post: PostType;
  relatedPosts?: PostType[];
  locale?: string;
}) {
  const t = useTranslations('blog.page');
  const relatedTitle = locale === 'zh' ? '相关文章' : 'Related articles';
  const relatedSubtitle =
    locale === 'zh' ? '为你推荐的文章' : 'Posts you may like';

  const crumbItems: NavItem[] = [
    {
      title: t('crumb'),
      url: '/blog',
      icon: 'Newspaper',
      is_active: false,
    },
    {
      title: post.title || '',
      url: `/blog/${post.slug}`,
      is_active: true,
    },
  ];

  // Check if TOC should be shown
  const showToc = post.toc && post.toc.length > 0;

  // Check if Author info should be shown
  const showAuthor = post.author_name || post.author_image || post.author_role;

  // Calculate main content column span based on what sidebars are shown
  const getMainColSpan = () => {
    return showToc ? 'lg:col-span-9' : 'lg:col-span-12';
  };

  const sidebarColSpan = 'lg:col-span-3';

  return (
    <TOCProvider toc={post.toc || []}>
      <section id={post.id}>
        <div className="py-24 md:py-32">
          <div className="mx-auto w-full max-w-[82rem] px-6 md:px-8">
            <Crumb items={crumbItems} />

            {/* Header Section */}
            <div className="mt-16 space-y-8">
              {/* Cover Image or Default Cover */}
              <div className="overflow-hidden rounded-2xl">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title || ''}
                    className="h-auto w-full object-cover"
                  />
                ) : (
                  <div className="relative flex aspect-[21/9] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255, 255, 255, 0.1) 30px, rgba(255, 255, 255, 0.1) 31px),
                                         repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255, 255, 255, 0.1) 30px, rgba(255, 255, 255, 0.1) 31px)`
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h1 className="text-foreground mx-auto mb-4 w-full text-3xl font-bold md:max-w-4xl md:text-4xl">
                  {post.title}
                </h1>

                {(showAuthor || post.created_at) && (
                  <div className="text-muted-foreground text-md mb-2 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-6">
                    {showAuthor && (
                      <div className="flex items-center gap-3">
                        {post.author_image && (
                          <div className="ring-foreground/10 flex size-12 items-center justify-center overflow-hidden rounded-full border border-transparent shadow-sm ring-1 shadow-black/10">
                            <img
                              src={post.author_image}
                              alt={post.author_name || ''}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="text-left">
                          {post.author_name && (
                            <p className="text-foreground text-base font-semibold">
                              {post.author_name}
                            </p>
                          )}
                          {post.author_role && (
                            <p className="text-muted-foreground text-sm">
                              {post.author_role}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {post.created_at && (
                      <div className="text-muted-foreground text-md flex items-center justify-center gap-2">
                        <CalendarIcon className="size-4" /> {post.created_at}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8 md:mt-12 lg:grid-cols-12">
              {/* Table of Contents - Left Sidebar */}
              {showToc && (
                <div className={`${sidebarColSpan} lg:max-w-xs xl:max-w-sm`}>
                  <div className="sticky top-24 hidden md:block">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="text-foreground mb-4 flex items-center gap-2 font-semibold text-sm uppercase tracking-wide">
                        <ListIcon className="size-4" /> {t('toc')}
                      </div>
                      <TOCItems />
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content - Center */}
              <div className={getMainColSpan()}>
                <article className="p-0">
                  <div className="mx-auto w-full max-w-[860px]">
                    {post.body ? (
                      <div className="docs text-foreground text-md space-y-4 font-normal *:leading-relaxed">
                        {post.body}
                      </div>
                    ) : (
                      post.content && (
                        <div className="prose prose-lg text-muted-foreground max-w-none space-y-6 *:leading-relaxed">
                          <MarkdownPreview content={post.content} />
                        </div>
                      )
                    )}
                  </div>
                </article>

                {relatedPosts.length > 0 && (
                  <div className="mt-16 border-t border-border pt-12">
                    <div className="flex items-center justify-between">
                      <h3 className="text-foreground text-2xl font-semibold">
                        {relatedTitle}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {relatedSubtitle}
                      </p>
                    </div>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {relatedPosts.slice(0, 6).map((item) => (
                        <Link
                          key={item.slug || item.url}
                          href={item.url || `/blog/${item.slug}`}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                          {item.image && (
                            <div className="relative aspect-[16/9] overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.title || ''}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col gap-3 p-5">
                            <p className="text-foreground line-clamp-2 text-lg font-semibold leading-snug">
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.created_at && (
                              <div className="text-muted-foreground mt-auto flex items-center gap-2 text-sm">
                                <CalendarIcon className="size-4" />
                                <span>{item.created_at}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </TOCProvider>
  );
}
