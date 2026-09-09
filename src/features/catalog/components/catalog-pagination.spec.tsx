import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination';
import { parseCatalogSearchParams } from '@/features/catalog/lib/catalog-params';

describe('CatalogPagination component', () => {
  const defaultParams = parseCatalogSearchParams({});

  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <CatalogPagination
        totalPages={1}
        currentPage={1}
        currentParams={defaultParams}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all page buttons when totalPages <= 7', () => {
    render(
      <CatalogPagination
        totalPages={5}
        currentPage={2}
        currentParams={defaultParams}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to previous page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to next page' })).toBeInTheDocument();

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('link', { name: `Page ${i}` })).toBeInTheDocument();
    }

    const page2 = screen.getByRole('link', { name: 'Page 2' });
    expect(page2).toHaveAttribute('aria-current', 'page');
  });

  it('windows page numbers and shows ellipsis when totalPages > 7', () => {
    render(
      <CatalogPagination
        totalPages={20}
        currentPage={10}
        currentParams={defaultParams}
      />,
    );

    expect(screen.getByRole('link', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 9' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 10' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 11' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 20' })).toBeInTheDocument();

    const page10 = screen.getByRole('link', { name: 'Page 10' });
    expect(page10).toHaveAttribute('aria-current', 'page');
  });

  it('clamps out of bounds currentPage safely', () => {
    render(
      <CatalogPagination
        totalPages={3}
        currentPage={999}
        currentParams={defaultParams}
      />,
    );

    const page3 = screen.getByRole('link', { name: 'Page 3' });
    expect(page3).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Go to next page' })).not.toBeInTheDocument();
  });
});
