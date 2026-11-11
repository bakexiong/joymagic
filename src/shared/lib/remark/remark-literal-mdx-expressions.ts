import { visit } from 'unist-util-visit';

type MdxTextExpression = {
  type: 'mdxTextExpression';
  value?: unknown;
};

type RemarkNode = {
  type?: string;
  [key: string]: unknown;
};

type ParentWithChildren = {
  children?: RemarkNode[];
};

const isMdxTextExpression = (node: RemarkNode): node is MdxTextExpression =>
  (node as MdxTextExpression)?.type === 'mdxTextExpression';

/**
 * Convert inline MDX expressions like `{foo}` into plain text so content
 * coming from CMS can use curly braces without causing ReferenceErrors.
 */
export function remarkLiteralMdxExpressions() {
  return (tree: RemarkNode) => {
    visit(tree as any, (node: any, index: number | undefined, parent: any) => {
      if (!node || node.type !== 'mdxTextExpression') return;
      if (typeof index !== 'number') return;

      const parentWithChildren = parent as ParentWithChildren | null;
      if (!parentWithChildren?.children) return;

      const raw = typeof node.value === 'string' ? node.value : '';
      parentWithChildren.children[index] = {
        type: 'text',
        value: `{${raw}}`,
      };
    });
  };
}
