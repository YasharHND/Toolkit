import { useState } from 'react';
import { Header } from './components/Header';
import { UUIDGenerator } from './components/UUIDGenerator';

type Tab = 'uuid';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('uuid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'uuid' && <UUIDGenerator />}
      </main>
    </div>
  );
}

export default App;
