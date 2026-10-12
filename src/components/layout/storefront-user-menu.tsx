'use client';

import Link from 'next/link';
import {
  ChevronDown,
  LogOut,
  Package,
  User as UserIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/lib/auth/auth-context';
import { formatStatusLabel } from '@/lib/format';
import {
  executeSignOut,
  StorefrontAuthLinks,
} from '@/components/layout/storefront-session-links';

type StorefrontUserMenuProps = {
  onNavigate?: () => void;
};

export function StorefrontUserMenu({ onNavigate }: StorefrontUserMenuProps) {
  const { status, session, logout } = useAuth();

  if (status === 'loading') {
    return (
      <div
        className="flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      />
    );
  }

  if (status === 'authenticated' && session) {
    const email = session.email?.trim() || null;
    const initial = email ? email.charAt(0).toUpperCase() : null;
    const emailPrefix = email ? email.split('@')[0] : null;
    const role = session.role?.trim() || null;
    const roleLabel = role ? formatStatusLabel(role) : null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="group flex cursor-pointer items-center gap-2 rounded-full border border-border/80 bg-background/80 py-1 pl-1 pr-2.5 shadow-xs transition-all hover:border-border hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={
              email
                ? `User account menu for ${email}`
                : 'User account menu'
            }
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-xs">
              {initial ? (
                initial
              ) : (
                <UserIcon className="size-3.5" aria-hidden="true" />
              )}
            </span>
            {emailPrefix ? (
              <span className="hidden max-w-[120px] truncate text-xs font-medium text-foreground sm:inline-block">
                {emailPrefix}
              </span>
            ) : null}
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
                {initial ? (
                  initial
                ) : (
                  <UserIcon className="size-4" aria-hidden="true" />
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                {email ? (
                  <span
                    className="truncate text-xs font-semibold text-foreground"
                    title={email}
                  >
                    {email}
                  </span>
                ) : null}
                {roleLabel ? (
                  <span className="mt-0.5 inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    {roleLabel}
                  </span>
                ) : null}
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

          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
            }}
            className="flex flex-col items-start gap-2 cursor-default px-2 py-2 focus:bg-transparent"
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              Appearance
            </span>
            <ThemeToggle className="w-full" />
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1.5" />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void executeSignOut(logout, onNavigate);
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
      <StorefrontAuthLinks onNavigate={onNavigate} />
      <ThemeToggle />
    </div>
  );
}
