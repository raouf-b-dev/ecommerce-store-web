import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ProductImage,
  isAllowedImageOrigin,
} from '@/features/catalog/components/product-image';

describe('isAllowedImageOrigin', () => {
  it('allows localhost:3000 in development', () => {
    expect(isAllowedImageOrigin('http://localhost:3000/pic.jpg')).toBe(true);
    expect(isAllowedImageOrigin('http://127.0.0.1:3000/pic.jpg')).toBe(true);
  });

  it('rejects localhost with missing/default port (port 80)', () => {
    expect(isAllowedImageOrigin('http://localhost/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('http://127.0.0.1/pic.jpg')).toBe(false);
  });

  it('rejects localhost with other ports', () => {
    expect(isAllowedImageOrigin('http://localhost:9999/pic.jpg')).toBe(false);
  });

  it('rejects unauthorized external hosts', () => {
    expect(isAllowedImageOrigin('https://evil.com/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('ftp://localhost:3000/pic.jpg')).toBe(false);
    expect(isAllowedImageOrigin('not-a-url')).toBe(false);
  });
});

describe('ProductImage component', () => {
  it('renders placeholder when src is null or undefined', () => {
    const { container } = render(<ProductImage src={null} alt="No image" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders placeholder when image origin is not allowed', () => {
    const { container } = render(
      <ProductImage src="http://localhost/pic.jpg" alt="Unallowed port" />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders image when origin is allowed and resets error on src change', () => {
    const { rerender, container } = render(
      <ProductImage
        src="http://localhost:3000/pic1.jpg"
        alt="Allowed pic 1"
        width={100}
        height={100}
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();

    // Trigger image load error
    fireEvent.error(img);

    // Placeholder should now be visible
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    // Updating src should reset error and attempt to render image again
    rerender(
      <ProductImage
        src="http://localhost:3000/pic2.jpg"
        alt="Allowed pic 2"
        width={100}
        height={100}
      />,
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
