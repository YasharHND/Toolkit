import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { UUIDPage } from './pages/UUIDPage';
import { UnescapePage } from './pages/UnescapePage';
import { JsonPage } from './pages/JsonPage';
import { PasswordPage } from './pages/PasswordPage';
import { UrlEncodePage } from './pages/UrlEncodePage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-zinc-800">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/uuid" element={<UUIDPage />} />
            <Route path="/unescape" element={<UnescapePage />} />
            <Route path="/json" element={<JsonPage />} />
            <Route path="/password" element={<PasswordPage />} />
            <Route path="/url-encode" element={<UrlEncodePage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
