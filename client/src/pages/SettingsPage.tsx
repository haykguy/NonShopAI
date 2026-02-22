import { useEffect, useState } from 'react';
import {
  Settings, Wifi, WifiOff, HardDrive, Cpu, Info, RefreshCw,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Film, Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HealthInfo {
  status: string;
  email?: string;
  credits?: number;
  outputDir?: string;
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 0',
        borderBottom: '1px solid var(--border)',
        gap: 24,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-body)', marginBottom: 2 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

interface SectionProps {
  icon: typeof Settings;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <div
      className="animate-fade-up ns-card"
      style={{ padding: '24px 28px', marginBottom: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div
          style={{
            width: 30,
            height: 30,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={14} color="var(--gold)" strokeWidth={2} />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ marginTop: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ios-toggle">
      <input type="checkbox" checked={enabled} onChange={e => onChange(e.target.checked)} />
      <span
        className="ios-toggle-track"
        style={{ background: enabled ? 'var(--success)' : 'var(--border-bright)' }}
      />
      <span className="ios-toggle-thumb" style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
    </label>
  );
}

export function SettingsPage() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);

  // Appearance
  const { isDark, toggleTheme } = useTheme();
  const [grainEffect, setGrainEffect] = useState(true);
  const [animationsOn, setAnimationsOn] = useState(true);
  const [compactMode, setCompactMode]   = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => { setHealth(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/health');
      const d = await res.json();
      setHealth(d);
      setTestResult('ok');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page-content">

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 36 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Configuration</div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 8,
          }}
        >
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Configure your NonTTS Studio instance and preferences.
        </p>
      </div>

      {/* ── API Connection ── */}
      <Section icon={Wifi} title="API Connection">
        <SettingRow label="Connection Status" description="Live connection to the NonTTS backend server">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? (
              <div className="badge badge-muted"><Loader2 size={10} className="animate-spin" /> Checking…</div>
            ) : health ? (
              <div className="badge badge-success"><CheckCircle2 size={10} /> Connected</div>
            ) : (
              <div className="badge badge-error"><AlertCircle size={10} /> Offline</div>
            )}
          </div>
        </SettingRow>

        <SettingRow label="Account Email" description="The UseAPI.net account associated with this instance">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: loading ? 'var(--text-dim)' : 'var(--text)' }}>
            {loading ? '—' : health?.email ?? 'Not available'}
          </span>
        </SettingRow>

        <SettingRow label="Credit Balance" description="Available generation credits on your account">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: loading ? 'var(--text-dim)' : 'var(--gold)',
            }}
          >
            {loading ? '—' : health?.credits !== undefined ? `${Number(health.credits).toFixed(4)}¢` : 'N/A'}
          </span>
        </SettingRow>

        <SettingRow label="Server URL" description="Backend API endpoint">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {window.location.origin}/api
          </span>
        </SettingRow>

        <div style={{ paddingTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="btn-ghost"
            style={{ fontSize: 13, padding: '8px 18px' }}
          >
            {testing ? (
              <><Loader2 size={13} className="animate-spin" /> Testing…</>
            ) : (
              <><RefreshCw size={13} /> Test Connection</>
            )}
          </button>
          {testResult === 'ok' && (
            <div className="badge badge-success"><CheckCircle2 size={10} /> Success</div>
          )}
          {testResult === 'fail' && (
            <div className="badge badge-error"><AlertCircle size={10} /> Failed</div>
          )}
        </div>
      </Section>

      {/* ── Storage ── */}
      <Section icon={HardDrive} title="Storage">
        <SettingRow label="Output Directory" description="Where generated videos and assets are saved on the server">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              direction: 'rtl',
              textAlign: 'right',
            }}
          >
            {loading ? '—' : health?.outputDir ?? 'server/output'}
          </div>
        </SettingRow>
        <SettingRow label="Project Data" description="Project metadata is stored as JSON files in the output directory">
          <div className="badge badge-muted">JSON files</div>
        </SettingRow>
        <SettingRow label="Video Assets" description="Generated images and video clips are stored alongside project data">
          <div className="badge badge-muted">Local filesystem</div>
        </SettingRow>
      </Section>

      {/* ── Generation ── */}
      <Section icon={Cpu} title="Generation">
        <SettingRow label="AI Engine" description="The video generation model powering Pixar AI">
          <div className="badge badge-gold"><Zap size={10} /> Google Veo 3.1</div>
        </SettingRow>
        <SettingRow label="Image Engine" description="Used for generating still images before video generation">
          <div className="badge badge-blue">Google Flow</div>
        </SettingRow>
        <SettingRow label="Pipeline" description="How generation tasks are queued and processed">
          <div className="badge badge-muted">Sequential</div>
        </SettingRow>
        <SettingRow label="SSE Events" description="Real-time progress updates use Server-Sent Events">
          <div className="badge badge-success"><CheckCircle2 size={10} /> Enabled</div>
        </SettingRow>
      </Section>

      {/* ── Appearance ── */}
      <Section icon={Settings} title="Appearance">
        <SettingRow label="Dark Mode" description="Switch between dark and light appearance">
          <Toggle enabled={isDark} onChange={toggleTheme} />
        </SettingRow>
        <SettingRow label="Film Grain Effect" description="Subtle texture overlay for cinematic feel">
          <Toggle enabled={grainEffect} onChange={setGrainEffect} />
        </SettingRow>
        <SettingRow label="UI Animations" description="Fade-in and slide-up animations on page load">
          <Toggle enabled={animationsOn} onChange={setAnimationsOn} />
        </SettingRow>
        <SettingRow label="Compact Mode" description="Reduce spacing for denser information display">
          <Toggle enabled={compactMode} onChange={setCompactMode} />
        </SettingRow>
      </Section>

      {/* ── About ── */}
      <Section icon={Info} title="About">
        <SettingRow label="Application" description="AI-powered video production studio">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            NonTTS Studio
          </span>
        </SettingRow>
        <SettingRow label="Version" description="Current application version">
          <div className="badge badge-muted">v1.0.0</div>
        </SettingRow>
        <SettingRow label="Stack" description="Technology stack">
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="badge badge-muted">React 19</div>
            <div className="badge badge-muted">TypeScript</div>
            <div className="badge badge-muted">Express</div>
          </div>
        </SettingRow>
        <SettingRow label="AI Provider" description="External API for video generation">
          <a
            href="https://useapi.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--gold)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            UseAPI.net <ExternalLink size={11} />
          </a>
        </SettingRow>
        <div style={{ paddingTop: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 18px',
              background: 'var(--gold-dim)',
              border: '1px solid rgba(232,168,48,0.18)',
              borderRadius: 10,
            }}
          >
            <Film size={15} color="var(--gold)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              NonTTS Studio generates AI video content using Google's Veo 3.1 model via the UseAPI.net platform.
              Ensure your API key has sufficient credits before starting a generation pipeline.
            </span>
          </div>
        </div>
      </Section>

    </div>
  );
}
