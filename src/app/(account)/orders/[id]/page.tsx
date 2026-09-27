import type { Metadata } from 'next';
import { OrderDetailContent } from '@/features/orders/components/order-detail-content';
import { parsePositiveInt } from '@/lib/list-filters';

export const metadata: Metadata = {
  title: 'Order details',
};

// ProtectedRoute must finish browser-only cookie bootstrap before order detail UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id: rawId } = await params;
  const id = parsePositiveInt(rawId) ?? 0;
  return <OrderDetailContent orderId={id} />;
}
