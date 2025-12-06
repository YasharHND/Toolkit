import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { UUIDPage } from './pages/UUIDPage';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-zinc-800">
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/uuid" element={<UUIDPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
