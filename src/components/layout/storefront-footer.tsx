import Link from 'next/link';
import type { Route } from 'next';
import { ShopMark } from '@/components/layout/shop-mark';
import { CATALOG_PATH } from '@/features/catalog/lib/catalog-params';
import { shop } from '@/lib/shop';

const FOOTER_SECTIONS: {
  title: string;
  links: { href: Route; label: string }[];
}[] = [
  {
    title: 'Shop',
    links: [
      { href: '/', label: 'Home' },
      { href: CATALOG_PATH, label: 'All products' },
      { href: '/cart', label: 'Cart' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/account', label: 'Your account' },
      { href: '/orders', label: 'Order history' },
    ],
  },
];

export function StorefrontFooter() {
  return (
    <footer className="mt-8 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
          >
            <ShopMark className="size-6" />
            {shop.name}
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            {shop.description}
          </p>
        </div>
        {FOOTER_SECTIONS.map((section) => (
          <nav
            key={section.title}
            aria-label={section.title}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold text-foreground">
              {section.title}
            </h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground">
          {shop.name} - {shop.tagline}
        </p>
      </div>
    </footer>
  );
}
