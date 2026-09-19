import Link from 'next/link';

export const STOREFRONT_NAV = [{ href: '/', label: 'Home' }] as const;

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
              className="text-sm font-medium hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
