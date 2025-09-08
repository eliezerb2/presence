import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DailyAttendance from './components/DailyAttendance';
import ClaimsManagement from './components/ClaimsManagement';
import MonthlyStats from './components/MonthlyStats';
import './App.css';

function App() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>מנהל נוכחות</h1>
        <nav className="nav">
          <Link to="/" className={isActive('/')}>
            נוכחות יומית
          </Link>
          <Link to="/claims" className={isActive('/claims')}>
            ניהול תביעות
          </Link>
          <Link to="/monthly-stats" className={isActive('/monthly-stats')}>
            סטטיסטיקות חודשיות
          </Link>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<DailyAttendance />} />
        <Route path="/claims" element={<ClaimsManagement />} />
        <Route path="/monthly-stats" element={<MonthlyStats />} />
      </Routes>
    </div>
  );
}

export default App;