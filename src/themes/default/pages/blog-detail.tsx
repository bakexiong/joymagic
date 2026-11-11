import { Post as PostType } from "@/shared/types/blocks/blog";
import { BlogDetail } from "@/themes/default/blocks/blog-detail";

export default async function BlogDetailPage({
  locale,
  post,
  relatedPosts,
}: {
  locale?: string;
  post: PostType;
  relatedPosts?: PostType[];
}) {
  return <BlogDetail post={post} relatedPosts={relatedPosts} locale={locale} />;
}
