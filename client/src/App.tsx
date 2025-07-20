import React from 'react';
import RaceForm from './components/RaceForm';
import RaceList from './components/RaceList';
import Statistics from './components/Statistics';
import AdvancedStatistics from './components/AdvancedStatistics';
import HorseNumberStatistics from './components/HorseNumberStatistics';
import RaceComposition from './components/RaceComposition';
import DataManager from './components/DataManager';
import StrategyAnalysis from './components/StrategyAnalysis';

function App() {
  return (
    <div className="App">
      <h1>競馬レース予想データベース</h1>
      <RaceForm />
      <hr />
      <RaceList />
      <hr />
      <DataManager />
      <hr />
      <RaceComposition />
      <hr />
      <Statistics />
      <hr />
      <AdvancedStatistics />
      <hr />
      <HorseNumberStatistics />
      <hr />
      <StrategyAnalysis />
    </div>
  );
}

export default App;
