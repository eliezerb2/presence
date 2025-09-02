import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Kiosk from './components/Kiosk';
import ManagerDashboard from './components/ManagerDashboard';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Kiosk />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
