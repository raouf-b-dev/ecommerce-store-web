import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { generateMetadata } from '@/app/(shop)/contact/page';
import ContactPage from '@/app/(shop)/contact/page';
import { INDEX_FOLLOW_ROBOTS, NO_INDEX_ROBOTS } from '@/lib/seo/config';
import * as shopModule from '@/lib/shop';
import { shop } from '@/lib/shop';
import * as storefrontOriginModule from '@/lib/storefront-origin';

describe('ContactPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(storefrontOriginModule, 'getStorefrontOrigin').mockReturnValue(
      'https://storefront.test',
    );
  });

  it('links the support address from shop config without demo wording', () => {
    render(<ContactPage />);

    const link = screen.getByRole('link', { name: shop.supportEmail });
    expect(link).toHaveAttribute('href', `mailto:${shop.supportEmail}`);
    expect(link).toHaveTextContent(shop.supportEmail);
    expect(screen.queryByText(/demo|placeholder/i)).not.toBeInTheDocument();
  });

  it('noindexes Contact while the support email is a placeholder', () => {
    vi.spyOn(shopModule, 'hasPlaceholderSupportEmail').mockReturnValue(true);

    const metadata = generateMetadata();

    expect(metadata.robots).toEqual(NO_INDEX_ROBOTS);
    expect(metadata.alternates?.canonical).toBe(
      'https://storefront.test/contact',
    );
  });

  it('indexes Contact when the support email is real', () => {
    vi.spyOn(shopModule, 'hasPlaceholderSupportEmail').mockReturnValue(false);

    const metadata = generateMetadata();

    expect(metadata.robots).toEqual(INDEX_FOLLOW_ROBOTS);
  });
});
