import { Package, ShieldCheck, Truck } from 'lucide-react';

const TRUST_POINTS = [
  {
    title: 'Ships from stock',
    description:
      'Catalog items are picked from available inventory. The cart and checkout show the shipping amount for your order.',
    Icon: Truck,
  },
  {
    title: 'Secure checkout',
    description:
      'Pay with card through our checkout flow. You get an order confirmation and can track status in your account.',
    Icon: ShieldCheck,
  },
  {
    title: 'Order history',
    description:
      'Signed-in shoppers can review past orders, shipment details, and totals anytime under Orders.',
    Icon: Package,
  },
] as const;

/** Static trust and shipping strip for the home landing page. */
export function HomeTrust() {
  return (
    <section
      aria-labelledby="home-trust-heading"
      className="rounded-2xl border bg-muted/40 px-6 py-8 md:px-10"
    >
      <h2
        id="home-trust-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Shopping with confidence
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Straight answers on shipping, checkout, and where to find your orders.
        The cart shows the shipping rate for your order before you pay.
      </p>
      <ul className="mt-8 grid gap-8 sm:grid-cols-3">
        {TRUST_POINTS.map(({ title, description, Icon }) => (
          <li key={title} className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon
                className="size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
