import React from 'react';
import './App.css';
import StudentSearch from './components/StudentSearch';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Kiosk Application</h1>
        <StudentSearch />
      </header>
    </div>
  );
}

export default App;
