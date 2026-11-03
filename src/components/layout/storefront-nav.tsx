import Link from 'next/link';
import { CATALOG_PATH } from '@/features/catalog/lib/catalog-params';

export const STOREFRONT_NAV = [
  { href: '/', label: 'Home' },
  { href: CATALOG_PATH, label: 'All products' },
] as const;

type StorefrontNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function StorefrontNav({ onNavigate, className }: StorefrontNavProps) {
  return (
    <nav aria-label="Storefront" className={className}>
      <ul className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-6">
        {STOREFRONT_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className="inline-flex min-h-11 items-center text-sm font-medium hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:min-h-0"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
