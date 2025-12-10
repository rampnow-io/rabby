'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '../../primitives';

type Item = Record<string, string>;

interface MultiSelectProps {
  data: Item[];
  displayKey: string;
  valueKey: string;
  selectedItems?: Item[];
  placeholder?: string;
  onChange?: (items: Item[]) => void;
}

export function MultiSelect({
  data,
  displayKey,
  valueKey,
  selectedItems = [],
  placeholder = 'Select',
  onChange,
}: MultiSelectProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Item[]>(selectedItems);
  const [inputValue, setInputValue] = useState('');

  const handleUnselect = useCallback(
    (item: Item) => {
      setSelected((prev) => {
        const updated = prev.filter((s) => s[valueKey] !== item[valueKey]);
        onChange?.(updated);
        return updated;
      });
    },
    [valueKey, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;

      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            setSelected((prev) => prev.slice(0, -1));
          }
        }

        if (e.key === 'Escape') {
          input.blur();
        }
      }
    },
    []
  );

  useEffect(() => {
    setSelected(selectedItems);
  }, [selectedItems]);

  return (
    <Command
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-transparent"
    >
      <div className="border-input ring-offset-background focus-within:ring-ring group w-full rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2">
        <div className="flex gap-2 overflow-y-auto">
          {selected.map((item) => (
            <div
              key={item[valueKey]}
              className="flex items-center justify-between rounded-xl border p-1 px-2"
            >
              <div className="flex items-center gap-2">
                <span>{item[displayKey]}</span>
              </div>
              <button
                className="ring-offset-background focus:ring-ring rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  handleUnselect(item);
                }}
              >
                <X className="text-muted-foreground hover:text-foreground h-4 w-4" />
              </button>
            </div>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => {
              setOpen(false);
            }}
            onFocus={() => {
              setOpen(true);
            }}
            placeholder={placeholder}
            className="placeholder:text-muted-foreground ml-2 flex-1 bg-transparent outline-none"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && data.length > 0 ? (
            <div className="bg-popover text-popover-foreground animate-in absolute top-0 z-10 max-h-60 w-full overflow-y-auto rounded-md border shadow-md outline-none">
              <CommandGroup className="h-full">
                {data.map((item) => {
                  const isSelected = selected.some(
                    (s) => s[valueKey] === item[valueKey]
                  );
                  return (
                    <CommandItem
                      key={item[valueKey]}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue('');
                        if (isSelected) {
                          handleUnselect(item);
                        } else {
                          const updated = [...selected, item];
                          setSelected(updated);
                          onChange?.(updated);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span>{item[displayKey]}</span>
                        {isSelected ? <Check className="h-4 w-4" /> : null}{' '}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
