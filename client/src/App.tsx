import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { PixarAiPage } from './pages/PixarAiPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NewVideoPage } from './pages/NewVideo';
import { TopOfFunnelPage } from './pages/NewVideo/TopOfFunnel';
import { CustomVideoPage } from './pages/NewVideo/Custom';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { AccountsPage } from './pages/Accounts';

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation />
        <main style={{ flex: 1, paddingTop: 'var(--nav-h)' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/new-video" element={<NewVideoPage />} />
            <Route path="/new-video/top-of-funnel" element={<TopOfFunnelPage />} />
            <Route path="/new-video/custom" element={<CustomVideoPage />} />
            <Route path="/pixar-ai" element={<PixarAiPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/anime-studio"
              element={
                <PlaceholderPage
                  title="Anime Studio"
                  emoji="🎌"
                  description="Create stunning anime-style animated content with AI-generated characters, dynamic action sequences, and iconic visual styles."
                  features={['Dynamic action sequences', 'Anime character generation', 'Multiple art styles', 'Epic soundtrack sync']}
                  accentColor="#f472b6"
                  accentDim="rgba(244,114,182,0.07)"
                  accentBorder="rgba(244,114,182,0.22)"
                />
              }
            />
            <Route
              path="/short-film"
              element={
                <PlaceholderPage
                  title="Short Film"
                  emoji="🎬"
                  description="Direct your own cinematic short films with professional-grade AI cinematography, editing tools, and narrative structure assistance."
                  features={['Cinematic camera work', 'Scene transitions', 'Narrative structure AI', 'Film grain & color grading']}
                  accentColor="#818cf8"
                  accentDim="rgba(129,140,248,0.07)"
                  accentBorder="rgba(129,140,248,0.22)"
                />
              }
            />
            <Route
              path="/documentary"
              element={
                <PlaceholderPage
                  title="Documentary"
                  emoji="📽️"
                  description="Craft compelling documentary narratives with AI-assisted research, voiceover generation, and visual storytelling tools."
                  features={['Research integration', 'Auto voiceover generation', 'Data visualization', 'Interview-style cuts']}
                  accentColor="#34d399"
                  accentDim="rgba(52,211,153,0.07)"
                  accentBorder="rgba(52,211,153,0.22)"
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </ThemeProvider>
  );
}
