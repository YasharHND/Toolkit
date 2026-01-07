import { useState } from 'react';

type Mode = 'encode' | 'decode';

export function UrlEncoder() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const processText = (text: string, processMode: Mode): string => {
    if (processMode === 'encode') {
      return encodeURIComponent(text);
    } else {
      return decodeURIComponent(text);
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    setCopied(false);
    setError('');

    if (!value.trim()) {
      setOutputText('');
      return;
    }

    try {
      setOutputText(processText(value, mode));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setOutputText('');
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setCopied(false);
    setError('');

    if (!inputText.trim()) return;

    try {
      setOutputText(processText(inputText, newMode));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setOutputText('');
    }
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
      setInputText(outputText);
      setMode(mode === 'encode' ? 'decode' : 'encode');
      setCopied(false);
      setError('');

      try {
        const newMode = mode === 'encode' ? 'decode' : 'encode';
        setOutputText(processText(outputText, newMode));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid input');
        setOutputText('');
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-zinc-600 bg-zinc-700 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">URL Encode / Decode</h2>

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
              <div className="text-xs opacity-80">Text → URL-safe</div>
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
              <div className="text-xs opacity-80">URL-safe → Text</div>
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <label htmlFor="input" className="mb-2 block text-sm font-medium text-zinc-300">
            {mode === 'encode' ? 'Text to Encode' : 'URL-encoded Text'}
          </label>
          <textarea
            id="input"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              mode === 'encode'
                ? 'Enter text to encode (e.g., Hello World! @#$%)'
                : 'Enter URL-encoded text (e.g., Hello%20World%21)'
            }
            rows={4}
            className={`w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
              {mode === 'encode' ? 'URL-encoded Result' : 'Decoded Text'}
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
          <h3 className="mb-2 font-semibold text-orange-500">URL Encoding</h3>
          <p className="text-sm text-zinc-400">
            {mode === 'encode'
              ? 'Converts special characters to percent-encoded format for safe use in URLs. Spaces become %20, special characters like @, #, $ become their hex equivalents.'
              : 'Converts percent-encoded characters back to their original form. For example, %20 becomes a space, %40 becomes @.'}
          </p>
        </div>
      </div>
    </div>
  );
}
