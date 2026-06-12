import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UploadPage from './pages/UploadPage';
import DownloadPage from './pages/DownloadPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <h1>ispDown</h1>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/download/:fileId" element={<DownloadPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
