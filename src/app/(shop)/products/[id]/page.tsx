import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { parsePositiveInt } from '@/lib/list-filters';
import { formatMoney } from '@/lib/format';
import { getStorefrontOrigin } from '@/lib/storefront-origin';
import { getProduct } from '@/features/catalog/api/get-product';
import { getProductInventory } from '@/features/catalog/api/get-product-inventory';
import { ProductImage } from '@/features/catalog/components/product-image';
import { ProductAvailability } from '@/features/catalog/components/product-availability';
import { AddToCartCta } from '@/features/catalog/components/add-to-cart-cta';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const productId = parsePositiveInt(resolvedParams.id);

  if (!productId) {
    return { title: 'Product Not Found' };
  }

  const product = await getProduct(productId);
  if (!product || !product.isActive) {
    return { title: 'Product Not Found' };
  }

  const origin = getStorefrontOrigin();
  const canonicalUrl = `${origin}/products/${product.id}`;

  return {
    title: product.name,
    description:
      product.description?.trim() ||
      `Buy ${product.name} at the storefront for ${formatMoney(product.price, product.currency)}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      description:
        product.description?.trim() ||
        `View details and availability for ${product.name}.`,
      url: canonicalUrl,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const productId = parsePositiveInt(resolvedParams.id);

  if (!productId) {
    notFound();
  }

  // Sequential fetch: product visibility is validated first
  const product = await getProduct(productId);
  if (!product || !product.isActive) {
    notFound();
  }

  const inventory = await getProductInventory(product.id);
  const isAvailable = (inventory?.availableQuantity ?? 0) > 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  const escapedJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              href="/"
              className="transition-colors hover:text-foreground hover:underline"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          {product.categoryName && product.categoryId ? (
            <>
              <li>
                <Link
                  href={`/?categoryId=${product.categoryId}`}
                  className="transition-colors hover:text-foreground hover:underline"
                >
                  {product.categoryName}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
            </>
          ) : null}
          <li
            aria-current="page"
            className="line-clamp-1 font-medium text-foreground"
          >
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Product Detail Grid */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Left: Product Media */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted/20 shadow-xs">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        {/* Right: Product Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {product.categoryName ? (
              <span className="inline-flex rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {product.categoryName}
              </span>
            ) : null}

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>

            <p className="text-xs text-muted-foreground">
              SKU: <span className="font-mono">{product.sku}</span>
            </p>

            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-3xl font-extrabold text-foreground">
                {formatMoney(product.price, product.currency)}
              </span>
              <ProductAvailability inventory={inventory} />
            </div>

            {product.description ? (
              <div className="pt-4 text-sm leading-relaxed text-muted-foreground">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                  Description
                </h2>
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            ) : null}
          </div>

          <div className="border-t pt-6">
            <AddToCartCta />
          </div>
        </div>
      </div>
    </article>
  );
}
