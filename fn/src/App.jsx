import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import CarDetail from './pages/CarDetail.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import KnowledgeBasePage from './pages/KnowledgeBasePage.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/ai" element={<AIAssistant />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>Cars AI Platform — Indian car marketplace. Built with React, Express, Supabase.</p>
      </footer>
    </div>
  );
}
