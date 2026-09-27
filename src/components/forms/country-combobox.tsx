'use client';

import { useState } from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRY_OPTIONS, countryName } from '@/lib/countries';
import { cn } from '@/lib/utils';

type CountryComboboxProps = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
};

/** Searchable country picker. Shows the country name, emits the ISO 3166-1 alpha-2 code. */
export function CountryCombobox({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedCode = value.toUpperCase();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span
            className={cn('truncate', !selectedCode && 'text-muted-foreground')}
          >
            {selectedCode ? countryName(selectedCode) : 'Select a country'}
          </span>
          <ChevronsUpDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command label="Countries">
          <CommandInput
            aria-label="Search countries"
            placeholder="Search countries"
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {COUNTRY_OPTIONS.map((option) => (
              <CommandItem
                key={option.code}
                value={`${option.name} ${option.code}`}
                onSelect={() => {
                  onChange(option.code);
                  setOpen(false);
                }}
              >
                <CheckIcon
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    option.code === selectedCode ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {option.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
