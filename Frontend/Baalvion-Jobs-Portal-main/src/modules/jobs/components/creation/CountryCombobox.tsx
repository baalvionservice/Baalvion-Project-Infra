'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { talentService } from '@/services/talent.service';

type CountryOption = { id: string; name: string; isHub?: boolean };

/**
 * Country picker over the full ISO-3166 list.
 *
 * A dropdown of ~250 entries is unusable without search, so this is a searchable
 * combobox. The nine countries with an established presence are grouped first because
 * they're what a recruiter picks nine times in ten — but every country is one keystroke
 * away, which is the point: a role can be posted anywhere.
 */
export function CountryCombobox({
  value,
  onChange,
  placeholder = 'Select a country',
}: {
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    talentService
      .getCountries({ isActive: true })
      .then((rows: any[]) => {
        if (!cancelled) setCountries(rows ?? []);
      })
      .catch(() => { /* leave the list empty; the field simply shows no options */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { hubs, rest } = useMemo(() => ({
    hubs: countries.filter((c) => c.isHub),
    rest: countries.filter((c) => !c.isHub),
  }), [countries]);

  const selected = countries.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {isLoading && !selected
            ? <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Loading countries…</span>
            : selected?.name ?? <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search all countries…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {hubs.length > 0 && (
              <CommandGroup heading="Where we already hire">
                {hubs.map((c) => (
                  <Option key={c.id} country={c} value={value} onPick={(id) => { onChange(id); setOpen(false); }} />
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading={hubs.length ? 'Everywhere else' : 'Countries'}>
              {rest.map((c) => (
                <Option key={c.id} country={c} value={value} onPick={(id) => { onChange(id); setOpen(false); }} />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Option({
  country,
  value,
  onPick,
}: {
  country: CountryOption;
  value?: string;
  onPick: (id: string) => void;
}) {
  return (
    <CommandItem value={country.name} onSelect={() => onPick(country.id)}>
      <Check className={cn('mr-2 h-4 w-4', value === country.id ? 'opacity-100' : 'opacity-0')} />
      {country.name}
    </CommandItem>
  );
}
