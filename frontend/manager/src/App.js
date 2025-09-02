import React from 'react';
import './App.css';
import DailyAttendanceBoard from './components/DailyAttendanceBoard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Manager Application</h1>
        <DailyAttendanceBoard />
      </header>
    </div>
  );
}

export default App;
