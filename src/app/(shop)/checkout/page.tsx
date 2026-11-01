import { CheckoutContent } from '@/features/checkout/components/checkout-content';

// ProtectedRoute must finish browser-only cookie bootstrap before checkout UI.
// This route depends on browser-only session bootstrap, so exempt it from instant-navigation validation.
export const instant = false;

export default function CheckoutPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <CheckoutContent />
    </div>
  );
}
