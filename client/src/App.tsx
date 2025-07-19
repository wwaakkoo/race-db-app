import React from 'react';
import RaceForm from './components/RaceForm';
import RaceList from './components/RaceList';
import Statistics from './components/Statistics';
import AdvancedStatistics from './components/AdvancedStatistics';

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
      <AdvancedStatistics />
    </div>
  );
}

export default App;
