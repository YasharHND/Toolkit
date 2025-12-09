import { JsonFormatter } from '../components/JsonFormatter';

export function JsonPage() {
  return (
    <div className="h-full">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <JsonFormatter />
      </main>
    </div>
  );
}
