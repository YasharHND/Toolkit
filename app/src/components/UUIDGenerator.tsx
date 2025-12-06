import { useState } from 'react';
import { Modal } from './Modal';

type UUIDVersion = 'v4' | 'v5';

export function UUIDGenerator() {
  const [version, setVersion] = useState<UUIDVersion>('v4');
  const [namespace, setNamespace] = useState('');
  const [name, setName] = useState('');

  // Separate states for each version
  const [v4UUID, setV4UUID] = useState('');
  const [v5UUID, setV5UUID] = useState('');
  const [v4Copied, setV4Copied] = useState(false);
  const [v5Copied, setV5Copied] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Get current UUID and copied state based on version
  const generatedUUID = version === 'v4' ? v4UUID : v5UUID;
  const copied = version === 'v4' ? v4Copied : v5Copied;

  // UUID v4 generator
  const generateUUIDv4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // UUID v5 generator (using SHA-1)
  const generateUUIDv5 = async (namespace: string, name: string): Promise<string> => {
    // Predefined namespaces
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

  const handleGenerate = async () => {
    if (version === 'v4') {
      setV4UUID(generateUUIDv4());
      setV4Copied(false);
    } else {
      // Check what's missing and create appropriate error message
      const missingFields = [];
      if (!namespace) missingFields.push('namespace');
      if (!name) missingFields.push('name');

      if (missingFields.length > 0) {
        const fieldList = missingFields.length === 2 ? 'namespace and name' : missingFields[0];
        setModalMessage(`Please provide a ${fieldList} for UUID v5`);
        setShowModal(true);
        return;
      }

      const uuid = await generateUUIDv5(namespace, name);
      setV5UUID(uuid);
      setV5Copied(false);
    }
  };

  const handleCopy = async () => {
    if (generatedUUID) {
      await navigator.clipboard.writeText(generatedUUID);
      if (version === 'v4') {
        setV4Copied(true);
        setTimeout(() => setV4Copied(false), 2000);
      } else {
        setV5Copied(true);
        setTimeout(() => setV5Copied(false), 2000);
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-gray-700 bg-gray-800 p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-white">UUID Generator</h2>

        {/* Version Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">UUID Version</label>
          <div className="flex gap-3">
            <button
              onClick={() => setVersion('v4')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                version === 'v4'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-orange-500 hover:text-white'
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
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              <div className="text-lg">Version 5</div>
              <div className="text-xs opacity-80">Name-based (SHA-1)</div>
            </button>
          </div>
        </div>

        {/* UUID v5 Inputs */}
        {version === 'v5' && (
          <div className="mb-6 space-y-4">
            <div>
              <label htmlFor="namespace" className="mb-2 block text-sm font-medium text-gray-300">
                Namespace
              </label>
              <select
                id="namespace"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="">Select a namespace or enter custom UUID below</option>
                <option value="DNS">DNS (Domain Name System)</option>
                <option value="URL">URL (Uniform Resource Locator)</option>
                <option value="OID">OID (ISO Object Identifier)</option>
                <option value="X500">X500 (X.500 Distinguished Name)</option>
              </select>
              <input
                type="text"
                placeholder="Or enter custom namespace UUID"
                value={
                  namespace && !['DNS', 'URL', 'OID', 'X500'].includes(namespace) ? namespace : ''
                }
                onChange={(e) => setNamespace(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name (e.g., example.com)"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-orange-700 hover:to-orange-600 active:scale-[0.98]"
        >
          Generate UUID
        </button>

        {/* Generated UUID Display */}
        {generatedUUID && (
          <div className="mt-6" key={`uuid-display-${version}`}>
            <label className="mb-2 block text-sm font-medium text-gray-300">Generated UUID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedUUID}
                readOnly
                className="flex-1 rounded-lg border border-gray-600 bg-gray-900 px-4 py-2.5 font-mono text-white focus:outline-none"
              />
              <button
                key={`copy-btn-${version}`}
                onClick={handleCopy}
                className={`rounded-lg px-6 py-2.5 font-medium transition-all ${
                  copied
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                {copied ? (
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
        <div className="mt-6 rounded-lg bg-gray-900 p-4">
          <h3 className="mb-2 font-semibold text-orange-500">
            {version === 'v4' ? 'UUID Version 4' : 'UUID Version 5'}
          </h3>
          <p className="text-sm text-gray-400">
            {version === 'v4'
              ? 'Generates a random UUID using cryptographically strong random values. Each UUID is unique and unpredictable.'
              : 'Generates a deterministic UUID based on a namespace and name using SHA-1 hashing. The same namespace and name will always produce the same UUID.'}
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
