import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { shop } from '@/lib/shop';
import { CATALOG_PATH } from '@/features/catalog/lib/catalog-params';

export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate overflow-hidden rounded-2xl border bg-muted"
    >
      <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
        <Image
          src="/shop/hero.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover object-[70%_center] md:object-right"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-linear-to-r from-background/95 via-background/70 to-transparent md:block"
        />
      </div>

      <div className="relative flex flex-col gap-4 bg-background/95 p-6 md:absolute md:inset-y-0 md:left-0 md:max-w-md md:justify-center md:bg-transparent md:p-10 lg:max-w-lg">
        <h1
          id="home-hero-heading"
          className="text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl lg:text-5xl"
        >
          {shop.tagline}
        </h1>
        <p className="text-base text-pretty text-muted-foreground md:text-lg">
          {shop.description}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg" className="h-11 px-5 text-base">
            <Link href={CATALOG_PATH}>Shop all products</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-5 text-base"
          >
            <Link href="#categories">Browse categories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
