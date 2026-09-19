import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileReadOnlyPanel } from './profile-read-only-panel';
import { createMockUserDetail } from '@/test/fixtures/account.fixture';
import { formatDateTime } from '@/lib/format';

describe('ProfileReadOnlyPanel', () => {
  it('renders profile fields without edit controls', () => {
    const user = createMockUserDetail({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@store.local',
      phone: '+15551234567',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    render(<ProfileReadOnlyPanel user={user} />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@store.local')).toBeInTheDocument();
    expect(screen.getByText('+15551234567')).toBeInTheDocument();
    expect(
      screen.getByText(formatDateTime(user.createdAt)),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('shows an em dash when phone is missing', () => {
    const user = createMockUserDetail({ phone: null });

    render(<ProfileReadOnlyPanel user={user} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
