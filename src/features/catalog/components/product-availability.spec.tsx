import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductAvailability } from '@/features/catalog/components/product-availability';

describe('ProductAvailability', () => {
  it('renders out of stock when inventory is null', () => {
    render(<ProductAvailability inventory={null} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('renders out of stock when availableQuantity is 0', () => {
    const inventory = {
      id: 1,
      productId: 1,
      sku: 'SKU1',
      productTitle: 'Item',
      availableQuantity: 0,
      reservedQuantity: 0,
      totalQuantity: 0,
      updatedAt: '',
    };
    render(<ProductAvailability inventory={inventory} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('renders in stock with exact quantity when availableQuantity > 0', () => {
    const inventory = {
      id: 1,
      productId: 1,
      sku: 'SKU1',
      productTitle: 'Item',
      availableQuantity: 7,
      reservedQuantity: 0,
      totalQuantity: 7,
      updatedAt: '',
    };
    render(<ProductAvailability inventory={inventory} />);
    expect(screen.getByText(/in stock \(7 available\)/i)).toBeInTheDocument();
  });
});
