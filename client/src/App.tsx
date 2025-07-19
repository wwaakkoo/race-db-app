import React from 'react';
import SimpleRaceForm from './components/SimpleRaceForm';
import RaceList from './components/RaceList';
import Statistics from './components/Statistics';

function App() {
  return (
    <div className="App">
      <h1>競馬レース予想データベース</h1>
      <SimpleRaceForm />
      <hr />
      <RaceList />
      <hr />
      <Statistics />
    </div>
  );
}

export default App;
