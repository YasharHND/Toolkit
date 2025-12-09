import { useState, useEffect } from 'react';

interface CharacterOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [options, setOptions] = useState<CharacterOptions>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndices, setCopiedIndices] = useState<boolean[]>([]);
  const [copiedButtonStates, setCopiedButtonStates] = useState<boolean[]>([]);

  const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  const generatePassword = (len: number, opts: CharacterOptions): string => {
    let charset = '';
    if (opts.uppercase) charset += characterSets.uppercase;
    if (opts.lowercase) charset += characterSets.lowercase;
    if (opts.numbers) charset += characterSets.numbers;
    if (opts.symbols) charset += characterSets.symbols;

    if (!charset) return '';

    const array = new Uint32Array(len);
    crypto.getRandomValues(array);

    return Array.from(array, (num) => charset[num % charset.length]).join('');
  };

  const handleGenerate = () => {
    const newPasswords = Array.from({ length: count }, () => generatePassword(length, options));
    setPasswords(newPasswords);
    setCopiedAll(false);
    setCopiedIndices(new Array(newPasswords.length).fill(false));
    setCopiedButtonStates(new Array(newPasswords.length).fill(false));
  };

  const handleCopy = async (password: string, index: number) => {
    await navigator.clipboard.writeText(password);

    const newCopiedIndices = [...copiedIndices];
    newCopiedIndices[index] = true;
    setCopiedIndices(newCopiedIndices);

    setCopiedButtonStates((prev) => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });

    setTimeout(() => {
      setCopiedButtonStates((prev) => {
        const newStates = [...prev];
        newStates[index] = false;
        return newStates;
      });
    }, 2000);
  };

  const handleCopyAll = async () => {
    if (passwords.length > 0) {
      await navigator.clipboard.writeText(passwords.join('\n'));
      setCopiedIndices(new Array(passwords.length).fill(true));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const clearPasswords = () => {
    setPasswords([]);
    setCopiedAll(false);
    setCopiedIndices([]);
    setCopiedButtonStates([]);
  };

  const handleLengthChange = (newLength: number) => {
    setLength(newLength);
    clearPasswords();
  };

  const handleCountChange = (newCount: number) => {
    setCount(Math.max(1, Math.min(20, newCount)));
    clearPasswords();
  };

  const toggleOption = (key: keyof CharacterOptions) => {
    const newOptions = { ...options, [key]: !options[key] };
    // Ensure at least one option is selected
    if (Object.values(newOptions).some((v) => v)) {
      setOptions(newOptions);
      clearPasswords();
    }
  };

  // Generate initial password on mount
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-zinc-600 bg-zinc-700 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Password Generator</h2>

        {/* Length Slider */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Length</label>
            <span className="text-lg font-bold text-orange-500">{length}</span>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => handleLengthChange(parseInt(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-600 accent-orange-500"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-500">
            <span>4</span>
            <span>64</span>
          </div>
        </div>

        {/* Character Options */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-zinc-300">Character Types</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: 'uppercase' as const, label: 'A-Z', desc: 'Uppercase' },
              { key: 'lowercase' as const, label: 'a-z', desc: 'Lowercase' },
              { key: 'numbers' as const, label: '0-9', desc: 'Numbers' },
              { key: 'symbols' as const, label: '!@#', desc: 'Symbols' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => toggleOption(option.key)}
                className={`rounded-lg border-2 px-4 py-3 text-center font-medium transition-all ${
                  options[option.key]
                    ? 'border-orange-600 bg-orange-600 text-white'
                    : 'border-zinc-500 bg-zinc-600 text-zinc-400 hover:border-orange-500 hover:text-zinc-300'
                }`}
              >
                <div className="font-mono text-lg">{option.label}</div>
                <div className="text-xs opacity-80">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Count and Generate */}
        <div className="mb-6 flex gap-3">
          <div className="relative w-32">
            <input
              type="text"
              value={count}
              onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-zinc-500 bg-zinc-600 py-3 pl-4 pr-10 text-center text-white [appearance:textfield] focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => handleCountChange(count + 1)}
                className="rounded bg-zinc-500 p-0.5 text-zinc-300 transition-colors hover:bg-zinc-400 hover:text-white"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleCountChange(count - 1)}
                className="rounded bg-zinc-500 p-0.5 text-zinc-300 transition-colors hover:bg-zinc-400 hover:text-white"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-orange-700 hover:to-orange-600 active:scale-[0.98]"
          >
            Generate Password{count > 1 ? 's' : ''}
          </button>
        </div>

        {/* Generated Passwords */}
        {passwords.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Generated Password{passwords.length > 1 ? 's' : ''}
              </label>
              {passwords.length > 1 && (
                <button
                  onClick={handleCopyAll}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    copiedAll
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                  }`}
                >
                  {copiedAll ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied All
                    </span>
                  ) : (
                    'Copy All'
                  )}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {passwords.map((password, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className={`flex-1 rounded-lg border px-4 py-2.5 font-mono text-sm transition-colors focus:outline-none ${
                      copiedIndices[index]
                        ? 'border-zinc-600 bg-zinc-800 text-zinc-500'
                        : 'border-zinc-500 bg-zinc-900 text-white'
                    }`}
                  />
                  <button
                    onClick={() => handleCopy(password, index)}
                    className={`rounded-lg px-6 py-2.5 font-medium transition-all ${
                      copiedButtonStates[index]
                        ? 'bg-orange-600 text-white'
                        : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                    }`}
                  >
                    {copiedButtonStates[index] ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-2 font-semibold text-orange-500">Secure Password Generation</h3>
          <p className="text-sm text-zinc-400">
            Passwords are generated using cryptographically secure random values. For maximum
            security, use longer passwords with all character types enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
