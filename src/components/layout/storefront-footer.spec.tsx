import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { StorefrontFooter } from './storefront-footer';

describe('StorefrontFooter', () => {
  it('links Shop, Account, and Help destinations without dead nested account paths', () => {
    render(<StorefrontFooter />);

    const shop = screen.getByRole('navigation', { name: 'Shop' });
    expect(within(shop).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      within(shop).getByRole('link', { name: 'All products' }),
    ).toHaveAttribute('href', '/products');
    expect(within(shop).getByRole('link', { name: 'Cart' })).toHaveAttribute(
      'href',
      '/cart',
    );

    const account = screen.getByRole('navigation', { name: 'Account' });
    expect(
      within(account).getByRole('link', { name: 'Account' }),
    ).toHaveAttribute('href', '/account');
    expect(
      within(account).getByRole('link', { name: 'Orders' }),
    ).toHaveAttribute('href', '/orders');

    const help = screen.getByRole('navigation', { name: 'Help' });
    expect(
      within(help).getByRole('link', { name: 'Shipping' }),
    ).toHaveAttribute('href', '/shipping');
    expect(within(help).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(within(help).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/contact',
    );
  });
});
