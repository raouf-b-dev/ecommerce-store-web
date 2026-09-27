import { serializeJsonLd } from '@/lib/seo/json-ld';

type JsonLdProps = {
  data: unknown;
};

/**
 * Renders Schema.org structured data. Metadata API does not cover JSON-LD.
 * Keep feature-specific builders under each feature lib; share only this primitive.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
