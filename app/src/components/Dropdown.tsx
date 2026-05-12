import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  searchable = false,
  searchPlaceholder = 'Search…',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filtered =
    searchable && search.trim()
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.trim().toLowerCase()))
      : options;

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    close();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-2.5 text-left text-white transition-colors hover:border-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 focus:outline-none"
      >
        <span className={selectedOption ? 'text-white' : 'text-zinc-400'}>
          {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
        </span>
        <svg
          className={`h-5 w-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-500 bg-zinc-600 shadow-xl">
          {searchable && (
            <div className="border-b border-zinc-500 p-2">
              <div className="relative">
                <svg
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') close();
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-md border border-zinc-500 bg-zinc-700 py-2 pr-3 pl-9 text-sm text-white placeholder-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 focus:outline-none"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-2.5 text-sm text-zinc-400">No matches</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left transition-colors ${
                    value === option.value
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-300 hover:bg-zinc-500 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
