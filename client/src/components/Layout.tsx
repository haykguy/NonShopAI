import { ReactNode } from 'react';
import { Film } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Film className="w-7 h-7 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">NonTTS Video Generator</h1>
          <span className="text-sm text-gray-500 ml-2">Google Flow / Veo 3.1</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
