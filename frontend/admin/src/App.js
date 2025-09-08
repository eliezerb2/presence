import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentsManagement from './components/StudentsManagement';
import PermanentAbsences from './components/PermanentAbsences';
import SchoolHolidays from './components/SchoolHolidays';
import Settings from './components/Settings';
import MonthlyOverrides from './components/MonthlyOverrides';
import './App.css';

function App() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <div className="container">
      <div className="header">
        <h1>ניהול מערכת נוכחות</h1>
        <nav className="nav">
          <Link to="/" className={isActive('/')}>
            ניהול תלמידים
          </Link>
          <Link to="/permanent-absences" className={isActive('/permanent-absences')}>
            היעדרויות קבועות
          </Link>
          <Link to="/school-holidays" className={isActive('/school-holidays')}>
            חגים וחופשות
          </Link>
          <Link to="/monthly-overrides" className={isActive('/monthly-overrides')}>
            עקיפות חודשיות
          </Link>
          <Link to="/settings" className={isActive('/settings')}>
            הגדרות מערכת
          </Link>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<StudentsManagement />} />
        <Route path="/permanent-absences" element={<PermanentAbsences />} />
        <Route path="/school-holidays" element={<SchoolHolidays />} />
        <Route path="/monthly-overrides" element={<MonthlyOverrides />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;