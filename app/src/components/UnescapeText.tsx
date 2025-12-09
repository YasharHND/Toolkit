import { useState } from 'react';

export function UnescapeText() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copied, setCopied] = useState(false);

  const unescapeText = (text: string): string => {
    try {
      // Use JSON.parse to handle standard escape sequences
      // Wrap in quotes to make it a valid JSON string
      return JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
    } catch {
      // If JSON.parse fails, do manual replacement for common escape sequences
      return text
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\b/g, '\b')
        .replace(/\\f/g, '\f')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\0/g, '\0')
        .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    setCopied(false);
    if (value) {
      setOutputText(unescapeText(value));
    } else {
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
    setCopied(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-zinc-600 bg-zinc-700 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Unescape Text</h2>

        {/* Input Section */}
        <div className="mb-6">
          <label htmlFor="input" className="mb-2 block text-sm font-medium text-zinc-300">
            Escaped Text
          </label>
          <textarea
            id="input"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter escaped text (e.g., Hello\nWorld or Hello\tWorld)"
            rows={6}
            className="w-full resize-none rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-3 font-mono text-white placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={handleClear}
            className="rounded-lg border border-zinc-500 bg-zinc-600 px-6 py-3 font-semibold text-zinc-300 transition-all hover:border-zinc-400 hover:bg-zinc-500 hover:text-white"
          >
            Clear
          </button>
        </div>

        {/* Output Section */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="output" className="text-sm font-medium text-zinc-300">
              Unescaped Text
            </label>
            {outputText && (
              <button
                onClick={handleCopy}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  copied
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
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
            placeholder="Unescaped result will appear here..."
            rows={6}
            className="w-full resize-none rounded-lg border border-zinc-500 bg-zinc-900 px-4 py-3 font-mono text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Info Section */}
        <div className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-2 font-semibold text-orange-500">Supported Escape Sequences</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400 sm:grid-cols-4">
            <div>
              <code className="text-orange-400">\n</code> → newline
            </div>
            <div>
              <code className="text-orange-400">\t</code> → tab
            </div>
            <div>
              <code className="text-orange-400">\r</code> → return
            </div>
            <div>
              <code className="text-orange-400">\\</code> → backslash
            </div>
            <div>
              <code className="text-orange-400">\&quot;</code> → quote
            </div>
            <div>
              <code className="text-orange-400">\&apos;</code> → apostrophe
            </div>
            <div>
              <code className="text-orange-400">\xHH</code> → hex
            </div>
            <div>
              <code className="text-orange-400">\uHHHH</code> → unicode
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
