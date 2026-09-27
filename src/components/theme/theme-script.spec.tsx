import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeScript } from '@/components/theme/theme-script';
import * as navigation from 'next/navigation';

vi.mock('next/navigation', () => ({
  useServerInsertedHTML: vi.fn(),
}));

describe('ThemeScript', () => {
  it('registers the anti-FOUC script with useServerInsertedHTML and renders null on client', () => {
    let insertedCallback: (() => React.ReactNode) | undefined;
    vi.mocked(navigation.useServerInsertedHTML).mockImplementation((cb) => {
      insertedCallback = cb as () => React.ReactNode;
    });

    const { container } = render(<ThemeScript />);

    // Client component returns null in the DOM
    expect(container.firstChild).toBeNull();
    // Server inserted HTML callback is registered
    expect(navigation.useServerInsertedHTML).toHaveBeenCalledTimes(1);
    expect(insertedCallback).toBeDefined();

    if (insertedCallback) {
      const element = insertedCallback() as React.ReactElement<{
        dangerouslySetInnerHTML: { __html: string };
      }>;
      expect(element.type).toBe('script');
      expect(element.props.dangerouslySetInnerHTML.__html).toContain('store-ui-theme');
    }
  });
});
