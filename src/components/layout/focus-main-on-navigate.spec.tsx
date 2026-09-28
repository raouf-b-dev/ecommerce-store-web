import { render } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { FocusMainOnNavigate } from '@/components/layout/focus-main-on-navigate';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('FocusMainOnNavigate', () => {
  it('moves focus to main on navigation without scrolling', () => {
    vi.mocked(usePathname).mockReturnValue('/login');
    const main = document.createElement('main');
    main.id = 'main';
    main.tabIndex = -1;
    document.body.append(main);
    const focusSpy = vi.spyOn(main, 'focus');

    const { rerender } = render(<FocusMainOnNavigate />);
    expect(focusSpy).not.toHaveBeenCalled();

    vi.mocked(usePathname).mockReturnValue('/');
    rerender(<FocusMainOnNavigate />);

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(main).toHaveFocus();
    main.remove();
  });
});
