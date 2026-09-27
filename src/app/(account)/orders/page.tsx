import type { Metadata } from 'next';
import { OrdersListContent } from '@/features/orders/components/orders-list-content';
import { parseOrderListFilters } from '@/features/orders/lib/order-list-filters';

export const metadata: Metadata = {
  title: 'Orders',
};

// ProtectedRoute must finish browser-only cookie bootstrap before orders UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const filters = parseOrderListFilters(await searchParams);
  return <OrdersListContent filters={filters} />;
}
