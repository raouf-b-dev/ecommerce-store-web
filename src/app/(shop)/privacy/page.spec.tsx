import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPage from '@/app/(shop)/privacy/page';

describe('PrivacyPage', () => {
  it('uses neutral copy without demo wording', () => {
    render(<PrivacyPage />);

    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });
});
