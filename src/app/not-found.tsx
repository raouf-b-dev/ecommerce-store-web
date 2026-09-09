import { headers } from 'next/headers';
import { PageHeader } from '@/components/layout/page-header';
import { StorefrontChrome } from '@/components/layout/storefront-chrome';
import { ProductNotFound } from '@/features/catalog/components/product-not-found';

export default async function NotFound() {
  const headersList = await headers();
  const isProductNotFound = headersList.get('x-not-found-type') === 'product';

  return (
    <StorefrontChrome>
      {isProductNotFound ? (
        <ProductNotFound />
      ) : (
        <PageHeader
          title="Page not found"
          description="That address is not a storefront page."
        />
      )}
    </StorefrontChrome>
  );
}
