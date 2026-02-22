import { ReactNode } from 'react';

// Layout is now a simple content wrapper — global Navigation handles the header.
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 28px 80px', position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  );
}
