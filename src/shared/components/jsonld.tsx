'use client';

import type { JsonLdSchema } from '@/shared/lib/jsonld';

interface JsonLdProps {
  data: JsonLdSchema | JsonLdSchema[];
}

/**
 * Component to inject JSON-LD structured data into the page
 *
 * Usage:
 * ```tsx
 * import { JsonLd } from '@/shared/components/jsonld';
 * import { generateOrganizationSchema, generateWebSiteSchema } from '@/shared/lib/jsonld';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <JsonLd data={[
 *         generateOrganizationSchema(),
 *         generateWebSiteSchema()
 *       ]} />
 *       {/* Page content *\/}
 *     </>
 *   );
 * }
 * ```
 */
export function JsonLd({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </>
  );
}

/**
 * Server component version for use in Server Components
 */
export function JsonLdScript({ data }: JsonLdProps) {
  const schemas = Array.isArray(data) ? data : [data];
  const jsonString = JSON.stringify(
    schemas.length === 1 ? schemas[0] : schemas,
    null,
    0
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
