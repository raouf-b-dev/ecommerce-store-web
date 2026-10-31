'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronDown,
  KeyRound,
  LogOut,
  Package,
  User as UserIcon,
} from 'lucide-react';
import { getChangePasswordRedirectPath } from '@/lib/auth/auth-routes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useTheme } from '@/components/theme/use-theme';
import { isTheme } from '@/components/theme/theme-store';
import { useAuth } from '@/lib/auth/auth-context';
import { getErrorMessage } from '@/lib/api/parse-api-error';
import { formatStatusLabel } from '@/lib/format';

type StorefrontUserMenuProps = {
  onNavigate?: () => void;
};

export function StorefrontUserMenu({ onNavigate }: StorefrontUserMenuProps) {
  const { status, session, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (status === 'loading') {
    return (
      <div
        className="flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      />
    );
  }

  if (status === 'authenticated' && session) {
    const email = session.email.trim();
    const role = session.role.trim();
    const initial = email.charAt(0).toUpperCase();
    const emailPrefix = email.split('@')[0];
    const roleLabel = formatStatusLabel(role);

    async function handleLogout() {
      try {
        await logout();
        onNavigate?.();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not sign out. Try again.'));
      }
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border/80 bg-background/80 py-1.5 pl-1.5 pr-3 shadow-xs transition-all hover:border-border hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="sr-only">User account menu for {email}</span>
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-xs"
            >
              {initial}
            </span>
            <span
              aria-hidden="true"
              className="hidden max-w-[120px] truncate text-xs font-medium text-foreground sm:inline-block"
            >
              {emailPrefix}
            </span>
            <ChevronDown
              className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 rounded-xl border border-border/80 bg-popover/95 p-2 shadow-xl backdrop-blur-md"
        >
          <DropdownMenuLabel className="px-2 py-2">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-xs">
                {initial}
              </div>
              <div className="flex min-w-0 flex-col">
                <span
                  className="truncate text-xs font-semibold text-foreground"
                  title={email}
                >
                  {email}
                </span>
                <span className="mt-0.5 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {roleLabel}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuItem asChild>
            <Link
              href="/orders"
              onClick={onNavigate}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
            >
              <Package className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">My Orders</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/account"
              onClick={onNavigate}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
            >
              <UserIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">Account Settings</span>
            </Link>
          </DropdownMenuItem>

          {session.permissions.includes('change_own_credentials') ? (
            <DropdownMenuItem asChild>
              <Link
                href={getChangePasswordRedirectPath('/account')}
                onClick={onNavigate}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
              >
                <KeyRound className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">Change password</span>
              </Link>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Appearance
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              if (isTheme(value)) {
                setTheme(value);
              }
            }}
          >
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void handleLogout();
            }}
            className="cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="font-medium">Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button variant="ghost" className="h-11 px-3" asChild>
        <Link href="/login" onClick={onNavigate}>
          Sign in
        </Link>
      </Button>
      <Button className="hidden h-11 px-3 sm:inline-flex" asChild>
        <Link href="/register" onClick={onNavigate}>
          Create account
        </Link>
      </Button>
      <ThemeToggle className="hidden sm:inline-flex" />
    </div>
  );
}
