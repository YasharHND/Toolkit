import { useState } from 'react';

type FormatMode = 'beautify' | 'minify';

export function JsonFormatter() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [mode, setMode] = useState<FormatMode>('beautify');
  const [copied, setCopied] = useState(false);

  const formatJson = (text: string, formatMode: FormatMode, indent: number): string => {
    const parsed = JSON.parse(text);
    if (formatMode === 'beautify') {
      return JSON.stringify(parsed, null, indent);
    }
    return JSON.stringify(parsed);
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
      setOutputText(formatJson(value, mode, indentSize));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setOutputText('');
    }
  };

  const handleModeChange = (newMode: FormatMode) => {
    setMode(newMode);
    setCopied(false);

    if (!inputText.trim()) return;

    try {
      setOutputText(formatJson(inputText, newMode, indentSize));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setOutputText('');
    }
  };

  const handleIndentChange = (newIndent: number) => {
    setIndentSize(newIndent);
    setCopied(false);

    if (!inputText.trim() || mode !== 'beautify') return;

    try {
      setOutputText(formatJson(inputText, mode, newIndent));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-zinc-600 bg-zinc-700 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">JSON Formatter</h2>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">Format Mode</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleModeChange('beautify')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                mode === 'beautify'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Beautify</div>
              <div className="text-xs opacity-80">Pretty print with indentation</div>
            </button>
            <button
              onClick={() => handleModeChange('minify')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                mode === 'minify'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Minify</div>
              <div className="text-xs opacity-80">Compact single line</div>
            </button>
          </div>
        </div>

        {/* Indent Size (only for beautify mode) */}
        {mode === 'beautify' && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-300">Indent Size</label>
            <div className="flex gap-2">
              {[2, 4, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => handleIndentChange(size)}
                  className={`rounded-lg px-4 py-2 font-medium transition-all ${
                    indentSize === size
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                  }`}
                >
                  {size} spaces
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input/Output Grid */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {/* Input Section */}
          <div>
            <div className="mb-2 flex h-8 items-center">
              <label htmlFor="input" className="text-sm font-medium text-zinc-300">
                Input JSON
              </label>
            </div>
            <textarea
              id="input"
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='{"key": "value", "array": [1, 2, 3]}'
              rows={12}
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

          {/* Output Section */}
          <div>
            <div className="mb-2 flex h-8 items-center justify-between">
              <label htmlFor="output" className="text-sm font-medium text-zinc-300">
                Formatted JSON
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
              placeholder="Formatted output will appear here..."
              rows={12}
              className="w-full resize-none rounded-lg border border-zinc-500 bg-zinc-900 px-4 py-3 font-mono text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="rounded-lg border border-zinc-500 bg-zinc-600 px-6 py-3 font-semibold text-zinc-300 transition-all hover:border-zinc-400 hover:bg-zinc-500 hover:text-white"
          >
            Clear
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-6 rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-2 font-semibold text-orange-500">JSON Formatter</h3>
          <p className="text-sm text-zinc-400">
            {mode === 'beautify'
              ? 'Beautify mode formats your JSON with proper indentation and line breaks, making it easy to read and debug.'
              : 'Minify mode removes all unnecessary whitespace, producing the most compact JSON representation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
