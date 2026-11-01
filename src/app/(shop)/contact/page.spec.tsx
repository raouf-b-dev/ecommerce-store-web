import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactPage from '@/app/(shop)/contact/page';
import { shop } from '@/lib/shop';

describe('ContactPage', () => {
  it('links the support address from shop config without demo wording', () => {
    render(<ContactPage />);

    const link = screen.getByRole('link', { name: shop.supportEmail });
    expect(link).toHaveAttribute('href', `mailto:${shop.supportEmail}`);
    expect(link).toHaveTextContent(shop.supportEmail);
    expect(screen.queryByText(/demo|placeholder/i)).not.toBeInTheDocument();
  });
});
