import React from 'react';
import RaceForm from './components/RaceForm';
import RaceList from './components/RaceList';
import Statistics from './components/Statistics';
import BetCalculator from './components/BetCalculator';

function App() {
  return (
    <div className="App">
      <h1>競馬レース予想データベース</h1>
      <RaceForm />
      <hr />
      <RaceList />
      <hr />
      <Statistics />
      <hr />
      <BetCalculator />
    </div>
  );
}

export default App;
