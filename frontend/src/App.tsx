import React, { useState } from 'react';
import './App.css';
import Kiosk from './Kiosk';
import Manager from './Manager'; // Import the Manager component

function App() {
  const [view, setView] = useState('kiosk'); // 'kiosk' or 'manager'

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <button onClick={() => setView('kiosk')} style={{ marginRight: '10px', padding: '10px 20px', fontSize: '1em' }}>Kiosk View</button>
          <button onClick={() => setView('manager')} style={{ padding: '10px 20px', fontSize: '1em' }}>Manager View</button>
        </div>
        {view === 'kiosk' ? <Kiosk /> : <Manager />}
      </header>
    </div>
  );
}

export default App;