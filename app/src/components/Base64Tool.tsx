import { useState } from 'react';

type Mode = 'encode' | 'decode';

const encodeBase64 = (text: string, urlSafe: boolean): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = btoa(binary);
  return urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base64;
};

const decodeBase64 = (text: string): string => {
  // Accept both standard and URL-safe alphabets, ignore whitespace, and restore missing padding
  const normalized = text.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error('Invalid Base64 input');
  }
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded data is not valid UTF-8 text (it may be binary)');
  }
};

export function Base64Tool() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const process = (text: string, processMode: Mode, processUrlSafe: boolean) => {
    setCopied(false);
    setError('');

    if (!text.trim()) {
      setOutputText('');
      return;
    }

    try {
      setOutputText(
        processMode === 'encode' ? encodeBase64(text, processUrlSafe) : decodeBase64(text)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setOutputText('');
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    process(value, mode, urlSafe);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    process(inputText, newMode, urlSafe);
  };

  const handleUrlSafeChange = (value: boolean) => {
    setUrlSafe(value);
    process(inputText, mode, value);
  };

  const handleCopy = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError('');
    setCopied(false);
  };

  const handleSwap = () => {
    if (outputText) {
      const newMode = mode === 'encode' ? 'decode' : 'encode';
      setInputText(outputText);
      setMode(newMode);
      process(outputText, newMode, urlSafe);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-zinc-600 bg-zinc-700 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Base64 Encode / Decode</h2>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">Mode</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleModeChange('encode')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                mode === 'encode'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Encode</div>
              <div className="text-xs opacity-80">Text → Base64</div>
            </button>
            <button
              onClick={() => handleModeChange('decode')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                mode === 'decode'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Decode</div>
              <div className="text-xs opacity-80">Base64 → Text</div>
            </button>
          </div>
        </div>

        {/* URL-safe Option */}
        {mode === 'encode' && (
          <div className="mb-6">
            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium text-zinc-300">
              <input
                type="checkbox"
                checked={urlSafe}
                onChange={(e) => handleUrlSafeChange(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-orange-600"
              />
              URL-safe (use - and _, no padding)
            </label>
          </div>
        )}

        {/* Input Section */}
        <div className="mb-6">
          <label htmlFor="input" className="mb-2 block text-sm font-medium text-zinc-300">
            {mode === 'encode' ? 'Text to Encode' : 'Base64 Text'}
          </label>
          <textarea
            id="input"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'Enter text to encode (e.g., Hello World!)'
                : 'Enter Base64 text (e.g., SGVsbG8gV29ybGQh)'
            }
            rows={4}
            className={`w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm text-white placeholder-zinc-400 focus:ring-2 focus:ring-orange-500/50 focus:outline-none ${
              error
                ? 'border-red-500 bg-zinc-600 focus:border-red-500'
                : 'border-zinc-500 bg-zinc-600 focus:border-orange-500'
            }`}
          />
          {error && (
            <p className="mt-2 flex items-center gap-2 text-sm text-red-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={handleClear}
            className="rounded-lg border border-zinc-500 bg-zinc-600 px-6 py-3 font-semibold text-zinc-300 transition-all hover:border-zinc-400 hover:bg-zinc-500 hover:text-white"
          >
            Clear
          </button>
          <button
            onClick={handleSwap}
            disabled={!outputText}
            className="flex items-center gap-2 rounded-lg border border-zinc-500 bg-zinc-600 px-6 py-3 font-semibold text-zinc-300 transition-all hover:border-zinc-400 hover:bg-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            Swap
          </button>
        </div>

        {/* Output Section */}
        <div className="mb-6">
          <div className="mb-2 flex h-8 items-center justify-between">
            <label htmlFor="output" className="text-sm font-medium text-zinc-300">
              {mode === 'encode' ? 'Base64 Result' : 'Decoded Text'}
            </label>
            {outputText && (
              <button
                onClick={handleCopy}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  copied
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
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
            )}
          </div>
          <textarea
            id="output"
            value={outputText}
            readOnly
            placeholder="Result will appear here..."
            rows={4}
            className="w-full resize-none rounded-lg border border-zinc-500 bg-zinc-900 px-4 py-3 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Info Section */}
        <div className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-2 font-semibold text-orange-500">Base64 Encoding</h3>
          <p className="text-sm text-zinc-400">
            {mode === 'encode'
              ? 'Converts text (as UTF-8 bytes) into Base64 using A–Z, a–z, 0–9, + and /, padded with =. The URL-safe variant swaps + and / for - and _ and drops padding, as used in JWTs.'
              : 'Converts Base64 back to UTF-8 text. Accepts both standard and URL-safe alphabets, ignores whitespace and line breaks, and restores missing padding automatically.'}
          </p>
        </div>
      </div>
    </div>
  );
}
