import { PasswordGenerator } from '../components/PasswordGenerator';

export function PasswordPage() {
  return (
    <div className="h-full">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PasswordGenerator />
      </main>
    </div>
  );
}
