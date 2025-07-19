import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Race } from '../types';
import ResultForm from './ResultForm';

const RaceList = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  const fetchRaces = () => {
    axios.get('/api/race')
      .then(res => {
        setRaces(res.data);
      })
      .catch(err => {
        console.error('レース一覧の取得に失敗:', err);
      });
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const handleResultUpdated = () => {
    setEditingRaceId(null);
    fetchRaces();
  };

  const handleCancelEdit = () => {
    setEditingRaceId(null);
  };

  return (
    <div>
      <h2>保存済みレース一覧</h2>
      <div>
        {races.map((race) => (
          <div key={race.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
            <div>
              <strong>{race.course} {race.level}</strong> / {race.surface} {race.distance}m [{race.condition}]<br />
              開催日: {race.date} | 出走頭数: {race.horses.length}
            </div>
            
            {race.result ? (
              <div style={{ marginTop: '5px', color: '#666' }}>
                結果: 1着 {race.result["1着"]} / 2着 {race.result["2着"]} / 3着 {race.result["3着"]}
              </div>
            ) : (
              <div style={{ marginTop: '5px', color: '#999' }}>
                結果未登録
              </div>
            )}
            
            <div style={{ marginTop: '10px' }}>
              {editingRaceId === race.id ? (
                <ResultForm 
                  race={race} 
                  onResultUpdated={handleResultUpdated}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <button 
                  onClick={() => setEditingRaceId(race.id)}
                  style={{ padding: '5px 10px' }}
                >
                  {race.result ? '結果を編集' : '結果を登録'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaceList;
