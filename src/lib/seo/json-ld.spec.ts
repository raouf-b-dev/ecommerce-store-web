import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '@/lib/seo/json-ld';

describe('serializeJsonLd', () => {
  it('serializes standard objects to valid JSON', () => {
    const data = { '@context': 'https://schema.org', '@type': 'Product', name: 'Shoes' };
    const serialized = serializeJsonLd(data);
    expect(JSON.parse(serialized)).toEqual(data);
  });

  it('escapes < and > to prevent HTML script tag injection and XSS', () => {
    const dangerous = {
      description: '</script><script>alert("xss")</script>',
    };
    const serialized = serializeJsonLd(dangerous);
    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c/script\\u003e');
  });

  it('escapes & to \\u0026', () => {
    const data = { query: 'shoes & socks' };
    const serialized = serializeJsonLd(data);
    expect(serialized).toContain('\\u0026');
  });

  it('escapes Unicode line terminators \\u2028 and \\u2029', () => {
    const data = { text: 'line 1\u2028line 2\u2029line 3' };
    const serialized = serializeJsonLd(data);
    expect(serialized).toContain('\\u2028');
    expect(serialized).toContain('\\u2029');
    expect(serialized).not.toContain('\u2028');
    expect(serialized).not.toContain('\u2029');
  });
});
