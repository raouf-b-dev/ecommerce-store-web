import Form from 'next/form';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATALOG_PATH } from '@/features/catalog/lib/catalog-params';

type BrowseAllBandProps = {
  total: number;
};

/** Landing-page exit to the full catalog: browse everything or search straight away. */
export function BrowseAllBand({ total }: BrowseAllBandProps) {
  return (
    <section
      id="all-products"
      aria-labelledby="browse-all-heading"
      className="scroll-mt-24 flex flex-col gap-6 rounded-2xl border bg-muted/40 p-6 md:flex-row md:items-center md:justify-between md:p-10"
    >
      <div className="space-y-2">
        <h2
          id="browse-all-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Browse all {total} {total === 1 ? 'product' : 'products'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Filter by category or price, or search for something specific.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
        <Form
          action={CATALOG_PATH}
          role="search"
          aria-label="Search products"
          className="relative sm:w-72"
        >
          <label htmlFor="landing-search" className="sr-only">
            Search products
          </label>
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="landing-search"
            name="search"
            type="search"
            enterKeyHint="search"
            placeholder="Search products"
            className="h-11 bg-background pl-9"
          />
        </Form>
        <Button asChild size="lg" className="h-11 px-5 text-base">
          <Link href={CATALOG_PATH}>Shop all products</Link>
        </Button>
      </div>
    </section>
  );
}
