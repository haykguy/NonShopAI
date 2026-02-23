import { NavLink, Link } from 'react-router-dom';
import { Film, Home, FolderOpen, Settings, Sparkles, Cpu, Sun, Moon, LayoutDashboard, Users, LibraryBig, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AccountInfo {
  connected: boolean;
  email?: string;
  credits?: number;
  tier?: string;
}

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/new-video', label: 'New Video', icon: Video, exact: false },
  { to: '/library', label: 'Library', icon: LibraryBig, exact: false },
  { to: '/accounts', label: 'Accounts', icon: Users, exact: false },
  { to: '/projects', label: 'Projects', icon: FolderOpen, exact: false },
  { to: '/settings', label: 'Settings', icon: Settings, exact: false },
];

export function Navigation() {
  const [account, setAccount] = useState<AccountInfo>({ connected: false });
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setAccount({ connected: true, email: d.email, credits: d.credits, tier: d.tier }))
      .catch(() => setAccount({ connected: false }));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navBg = isDark
    ? (scrolled ? 'rgba(5, 5, 7, 0.90)' : 'rgba(5, 5, 7, 0.55)')
    : (scrolled ? 'rgba(242, 242, 247, 0.92)' : 'rgba(242, 242, 247, 0.72)');

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-h)',
        zIndex: 1000,
        background: navBg,
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        borderBottom: '1px solid transparent',
        backgroundImage: scrolled
          ? `linear-gradient(${navBg}, ${navBg}), linear-gradient(90deg, transparent, rgba(168,85,247,0.35), rgba(245,166,35,0.35), rgba(59,130,246,0.35), transparent)`
          : undefined,
        backgroundOrigin: scrolled ? 'border-box' : undefined,
        backgroundClip: scrolled ? 'padding-box, border-box' : undefined,
        boxShadow: scrolled ? '0 1px 0 var(--separator)' : undefined,
        transition: 'background 0.3s ease, border-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            textDecoration: 'none',
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--gold)',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(245, 166, 35, 0.30)',
            }}
          >
            <Film size={17} color="#000" strokeWidth={2.5} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              NonTTS
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 1,
              }}
            >
              Studio
            </div>
          </div>
        </Link>

        {/* ── Nav links ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          {navLinks.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--font-body)',
                color: isActive ? 'var(--text)' : 'var(--text-secondary)',
                background: isActive ? 'var(--glass-bg-heavy)' : 'transparent',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.01em',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                if (el.getAttribute('aria-current') !== 'page') {
                  el.style.color = 'var(--text)';
                  el.style.background = 'var(--glass-bg)';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                if (el.getAttribute('aria-current') !== 'page') {
                  el.style.color = 'var(--text-secondary)';
                  el.style.background = 'transparent';
                }
              }}
            >
              <Icon size={14} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* ── Right: CTA + status + theme toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Pixar AI button */}
          <Link
            to="/pixar-ai"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 14px',
              background: 'var(--gold)',
              color: '#000',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              letterSpacing: '-0.01em',
              transition: 'opacity 0.15s, transform 0.12s, box-shadow 0.15s',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(245, 166, 35, 0.25)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.opacity = '0.88';
              el.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.opacity = '1';
              el.style.transform = 'translateY(0)';
            }}
          >
            <Sparkles size={12} strokeWidth={2.5} />
            Pixar AI
          </Link>

          {/* API status chip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              flexShrink: 0,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: account.connected ? 'var(--success)' : 'var(--error)',
                boxShadow: account.connected ? '0 0 6px var(--success)' : 'none',
                flexShrink: 0,
              }}
            />
            <span style={{ color: account.connected ? 'var(--text)' : 'var(--text-muted)' }}>
              {account.connected
                ? account.credits !== undefined
                  ? `${Number(account.credits).toFixed(2)}¢`
                  : 'API OK'
                : 'Offline'}
            </span>
            {account.connected && account.email && (
              <span style={{ color: 'var(--text-muted)', fontSize: 10, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {account.email}
              </span>
            )}
            {account.connected && (
              <Cpu size={10} color="var(--text-dim)" />
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'var(--glass-bg-heavy)';
              el.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'var(--glass-bg)';
              el.style.color = 'var(--text-secondary)';
            }}
          >
            {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
