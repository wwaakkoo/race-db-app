import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Horse {
  frameNumber: number;
  horseNumber: number;
  name: string;
  sex: string;
  age: number;
  weight: number;
  jockey: string;
  odds: number;
  popularity: number;
}

interface Race {
  id: string;
  raceInfo: {
    course: string;
    distance: string;
    surface: string;
    condition: string;
    level: string;
  };
  horses: Horse[];
}

const RaceList = () => {
  const [races, setRaces] = useState<Race[]>([]);

  useEffect(() => {
    axios.get('/api/race')
      .then(res => {
        setRaces(res.data);
      })
      .catch(err => {
        console.error('レース一覧の取得に失敗:', err);
      });
  }, []);

  return (
    <div>
      <h2>保存済みレース一覧</h2>
      <ul>
        {races.map((race) => (
          <li key={race.id}>
            <strong>{race.raceInfo.course} {race.raceInfo.level}</strong> / {race.raceInfo.surface}{race.raceInfo.distance}m [{race.raceInfo.condition}]<br />
            出走頭数: {race.horses.length}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RaceList;
