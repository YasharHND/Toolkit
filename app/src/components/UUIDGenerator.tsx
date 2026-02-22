import { useState } from 'react';
import { Modal } from './Modal';
import { Dropdown } from './Dropdown';

type UUIDVersion = 'v4' | 'v5' | 'v7';

// UUID v4 generator (random)
const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// UUID v5 generator (name-based, SHA-1)
const generateUUIDv5 = async (namespace: string, name: string): Promise<string> => {
  const namespaces: Record<string, string> = {
    DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
  };

  const ns = namespaces[namespace] || namespace;

  // Convert namespace UUID to bytes
  const nsBytes =
    ns
      .replace(/-/g, '')
      .match(/.{2}/g)
      ?.map((byte) => parseInt(byte, 16)) || [];

  // Convert name to bytes
  const nameBytes = new TextEncoder().encode(name);

  // Combine namespace and name
  const combined = new Uint8Array([...nsBytes, ...nameBytes]);

  // Generate SHA-1 hash
  const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Set version (5) and variant bits
  hashArray[6] = (hashArray[6] & 0x0f) | 0x50;
  hashArray[8] = (hashArray[8] & 0x3f) | 0x80;

  // Convert to UUID format
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

// UUID v7 generator (time-ordered)
const generateUUIDv7 = (): string => {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // First 48 bits: Unix timestamp in milliseconds
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // Version 7
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // Variant 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

export function UUIDGenerator() {
  const [version, setVersion] = useState<UUIDVersion>('v4');
  const [namespace, setNamespace] = useState('');
  const [name, setName] = useState('');

  // Clear v5 UUID when inputs change
  const handleNamespaceChange = (value: string) => {
    setNamespace(value);
    setV5UUID('');
    setV5Copied(false);
    setV5CopiedPermanent(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setV5UUID('');
    setV5Copied(false);
    setV5CopiedPermanent(false);
  };
  // Separate states for each version
  const [v4Count, setV4Count] = useState(1);
  const [v4UUIDs, setV4UUIDs] = useState<string[]>([]);
  const [v4Copied, setV4Copied] = useState(false);
  const [v4CopiedIndices, setV4CopiedIndices] = useState<boolean[]>([]);
  const [v4CopiedButtonStates, setV4CopiedButtonStates] = useState<boolean[]>([]);

  const [v5UUID, setV5UUID] = useState('');
  const [v5Copied, setV5Copied] = useState(false);
  const [v5CopiedPermanent, setV5CopiedPermanent] = useState(false);

  const [v7Count, setV7Count] = useState(1);
  const [v7UUIDs, setV7UUIDs] = useState<string[]>([]);
  const [v7Copied, setV7Copied] = useState(false);
  const [v7CopiedIndices, setV7CopiedIndices] = useState<boolean[]>([]);
  const [v7CopiedButtonStates, setV7CopiedButtonStates] = useState<boolean[]>([]);

  // Derive active bulk-UUID state based on version
  const isV7 = version === 'v7';
  const count = isV7 ? v7Count : v4Count;
  const setCount = isV7 ? setV7Count : setV4Count;
  const currentUUIDs = isV7 ? v7UUIDs : v4UUIDs;
  const currentCopied = isV7 ? v7Copied : v4Copied;
  const currentCopiedIndices = isV7 ? v7CopiedIndices : v4CopiedIndices;
  const currentCopiedButtonStates = isV7 ? v7CopiedButtonStates : v4CopiedButtonStates;
  const setCurrentUUIDs = isV7 ? setV7UUIDs : setV4UUIDs;
  const setCurrentCopied = isV7 ? setV7Copied : setV4Copied;
  const setCurrentCopiedIndices = isV7 ? setV7CopiedIndices : setV4CopiedIndices;
  const setCurrentCopiedButtonStates = isV7 ? setV7CopiedButtonStates : setV4CopiedButtonStates;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleGenerate = async () => {
    if (version === 'v4' || version === 'v7') {
      const generator = version === 'v4' ? generateUUIDv4 : generateUUIDv7;
      const uuids = Array.from({ length: count }, () => generator());
      setCurrentUUIDs(uuids);
      setCurrentCopied(false);
      setCurrentCopiedIndices(new Array(uuids.length).fill(false));
      setCurrentCopiedButtonStates(new Array(uuids.length).fill(false));
    } else {
      // Check what's missing and create appropriate error message
      const missingFields = [];
      if (!namespace) missingFields.push('namespace');
      if (!name) missingFields.push('value');

      if (missingFields.length > 0) {
        const fieldList = missingFields.length === 2 ? 'namespace and value' : missingFields[0];
        setModalMessage(`Please provide a ${fieldList} for UUID v5`);
        setShowModal(true);
        return;
      }

      const uuid = await generateUUIDv5(namespace, name);
      setV5UUID(uuid);
      setV5Copied(false);
      setV5CopiedPermanent(false);
    }
  };

  const handleCopy = async (uuid: string, index?: number) => {
    await navigator.clipboard.writeText(uuid);
    if (version === 'v4' || version === 'v7') {
      if (index !== undefined) {
        // Mark this specific UUID as copied permanently
        const newCopiedStates = [...(currentCopiedIndices || [])];
        newCopiedStates[index] = true;
        setCurrentCopiedIndices(newCopiedStates);

        // Show button feedback temporarily
        setCurrentCopiedButtonStates((prev) => {
          const newButtonStates = [...prev];
          newButtonStates[index] = true;
          return newButtonStates;
        });
        setTimeout(() => {
          setCurrentCopiedButtonStates((prev) => {
            const resetStates = [...prev];
            resetStates[index] = false;
            return resetStates;
          });
        }, 2000);
      }
    } else {
      // Mark v5 UUID as copied permanently
      setV5CopiedPermanent(true);

      // Show button feedback temporarily
      setV5Copied(true);
      setTimeout(() => setV5Copied(false), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (currentUUIDs.length > 0) {
      await navigator.clipboard.writeText(currentUUIDs.join('\n'));
      // Mark all as copied permanently
      setCurrentCopiedIndices(new Array(currentUUIDs.length).fill(true));

      // Show button feedback temporarily
      setCurrentCopied(true);
      setTimeout(() => setCurrentCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-zinc-600 bg-zinc-700 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">UUID Generator</h2>

        {/* Version Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">UUID Version</label>
          <div className="flex gap-3">
            <button
              onClick={() => setVersion('v4')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                version === 'v4'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Version 4</div>
              <div className="text-xs opacity-80">Random UUID</div>
            </button>
            <button
              onClick={() => setVersion('v5')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                version === 'v5'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Version 5</div>
              <div className="text-xs opacity-80">Name-based (SHA-1)</div>
            </button>
            <button
              onClick={() => setVersion('v7')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                version === 'v7'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Version 7</div>
              <div className="text-xs opacity-80">Time-ordered</div>
            </button>
          </div>
        </div>

        {/* UUID v5 Inputs */}
        {version === 'v5' && (
          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="namespace" className="mb-2 block text-sm font-medium text-zinc-300">
                Namespace
              </label>
              <Dropdown
                options={[
                  { value: '', label: 'Select a namespace or enter custom UUID below' },
                  { value: 'DNS', label: 'DNS (Domain Name System)' },
                  { value: 'URL', label: 'URL (Uniform Resource Locator)' },
                  { value: 'OID', label: 'OID (ISO Object Identifier)' },
                  { value: 'X500', label: 'X500 (X.500 Distinguished Name)' },
                ]}
                value={
                  namespace && ['DNS', 'URL', 'OID', 'X500'].includes(namespace) ? namespace : ''
                }
                onChange={handleNamespaceChange}
                placeholder="Select a namespace"
              />
              <input
                type="text"
                placeholder="Or enter custom namespace UUID"
                value={
                  namespace && !['DNS', 'URL', 'OID', 'X500'].includes(namespace) ? namespace : ''
                }
                onChange={(e) => handleNamespaceChange(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-2.5 text-white placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            <div>
              <label htmlFor="value" className="mb-2 block text-sm font-medium text-zinc-300">
                Value
              </label>
              <input
                type="text"
                id="value"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter a value (e.g., example.com)"
                className="w-full rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-2.5 text-white placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>
        )}

        {/* Count Input for v4 and Generate Button */}
        <div className="flex gap-3">
          {(version === 'v4' || version === 'v7') && (
            <div className="relative w-32">
              <input
                type="text"
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setCount(Math.max(1, Math.min(100, val)));
                }}
                className="w-full rounded-lg border border-zinc-500 bg-zinc-600 py-3 pl-4 pr-10 text-center text-white [appearance:textfield] focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setCount((c) => Math.min(100, c + 1))}
                  className="rounded bg-zinc-500 p-0.5 text-zinc-300 transition-colors hover:bg-zinc-400 hover:text-white"
                  aria-label="Increment"
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
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="rounded bg-zinc-500 p-0.5 text-zinc-300 transition-colors hover:bg-zinc-400 hover:text-white"
                  aria-label="Decrement"
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
          )}
          <button
            onClick={handleGenerate}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-orange-700 hover:to-orange-600 active:scale-[0.98]"
          >
            Generate UUID{(version === 'v4' || version === 'v7') && count > 1 ? 's' : ''}
          </button>
        </div>

        {/* Generated UUID Display */}
        {(version === 'v4' || version === 'v7') && currentUUIDs.length > 0 && (
          <div className="mt-6" key={`uuid-display-${version}`}>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Generated UUID{currentUUIDs.length > 1 ? 's' : ''}
              </label>
              {currentUUIDs.length > 1 && (
                <button
                  onClick={handleCopyAll}
                  className={`rounded-lg px-6 py-2.5 font-medium transition-all ${
                    currentCopied
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                  }`}
                >
                  {currentCopied ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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
              {currentUUIDs.map((uuid, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={uuid}
                    readOnly
                    className={`flex-1 rounded-lg border px-4 py-2.5 font-mono transition-colors focus:outline-none ${
                      currentCopiedIndices[index] || currentCopied
                        ? 'border-zinc-600 bg-zinc-800 text-zinc-500'
                        : 'border-zinc-500 bg-zinc-900 text-white'
                    }`}
                  />
                  <button
                    onClick={() => handleCopy(uuid, index)}
                    className={`rounded-lg px-6 py-2.5 font-medium transition-all ${
                      currentCopiedButtonStates[index]
                        ? 'bg-orange-600 text-white'
                        : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                    }`}
                  >
                    {currentCopiedButtonStates[index] ? (
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

        {/* Generated UUID Display for v5 */}
        {version === 'v5' && v5UUID && (
          <div className="mt-6" key="uuid-display-v5">
            <label className="mb-2 block text-sm font-medium text-zinc-300">Generated UUID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={v5UUID}
                readOnly
                className={`flex-1 rounded-lg border px-4 py-2.5 font-mono transition-colors focus:outline-none ${
                  v5CopiedPermanent
                    ? 'border-zinc-600 bg-zinc-800 text-zinc-500'
                    : 'border-zinc-500 bg-zinc-900 text-white'
                }`}
              />
              <button
                onClick={() => handleCopy(v5UUID)}
                className={`rounded-lg px-6 py-2.5 font-medium transition-all ${
                  v5Copied
                    ? 'bg-orange-600 text-white'
                    : 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 hover:text-white'
                }`}
              >
                {v5Copied ? (
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
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-2 font-semibold text-orange-500">
            {version === 'v4'
              ? 'UUID Version 4'
              : version === 'v5'
                ? 'UUID Version 5'
                : 'UUID Version 7'}
          </h3>
          <p className="text-sm text-zinc-400">
            {version === 'v4'
              ? 'Generates a random UUID using cryptographically strong random values. Each UUID is unique and unpredictable.'
              : version === 'v5'
                ? 'Generates a deterministic UUID based on a namespace and value using SHA-1 hashing. The same namespace and value will always produce the same UUID.'
                : 'Generates a time-ordered UUID with a Unix timestamp in the first 48 bits followed by random data. UUIDs are sortable by creation time, making them ideal for database primary keys.'}
          </p>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Missing Information"
        message={modalMessage}
      />
    </div>
  );
}
