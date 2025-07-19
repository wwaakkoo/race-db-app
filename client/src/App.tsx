import React from 'react';
import RaceForm from './components/RaceForm';
import RaceList from './components/RaceList';

function App() {
  return (
    <div className="App">
      <h1>競馬レース予想データベース</h1>
      <RaceForm />
      <hr />
      <RaceList />
    </div>
  );
}

export default App;
