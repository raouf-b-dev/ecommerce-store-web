// Copyright (c) 2026 Abderaouf Bouzerara
// SPDX-License-Identifier: AGPL-3.0-only

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductAvailability } from '@/features/catalog/components/product-availability';
import { createMockInventory } from '@/test/fixtures/catalog.fixture';

describe('ProductAvailability', () => {
  it('renders out of stock when inventory is null', () => {
    render(<ProductAvailability inventory={null} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('renders out of stock when unavailable', () => {
    render(
      <ProductAvailability
        inventory={createMockInventory({
          isAvailable: false,
          availableQuantity: 0,
        })}
      />,
    );
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('renders in stock with exact quantity when available', () => {
    render(
      <ProductAvailability
        inventory={createMockInventory({
          isAvailable: true,
          availableQuantity: 7,
        })}
      />,
    );
    expect(screen.getByText(/in stock \(7 available\)/i)).toBeInTheDocument();
  });
});
