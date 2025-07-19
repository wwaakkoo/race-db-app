import React, { useState } from 'react';
import axios from 'axios';
import { Race, RaceResult } from '../types';

interface ResultFormProps {
  race: Race;
  onResultUpdated: () => void;
  onCancel: () => void;
}

const ResultForm: React.FC<ResultFormProps> = ({ race, onResultUpdated, onCancel }) => {
  const [result, setResult] = useState<RaceResult>(race.result || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`/api/race/${race.id}/result`, result);
      onResultUpdated();
    } catch (error) {
      console.error('結果登録エラー:', error);
      alert('結果の登録に失敗しました');
    }
    setLoading(false);
  };

  const handleResultChange = (position: '1着' | '2着' | '3着', value: string) => {
    setResult(prev => ({
      ...prev,
      [position]: value
    }));
  };

  return (
    <div style={{ margin: '10px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h4>レース結果入力 - {race.course} {race.level}</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            1着馬名:
            <select 
              value={result["1着"] || ""} 
              onChange={(e) => handleResultChange("1着", e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
              required
            >
              <option value="">選択してください</option>
              {race.horses.map(horse => (
                <option key={horse.horseNumber} value={horse.name}>
                  {horse.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            2着馬名:
            <select 
              value={result["2着"] || ""} 
              onChange={(e) => handleResultChange("2着", e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
              required
            >
              <option value="">選択してください</option>
              {race.horses.filter(horse => horse.name !== result["1着"]).map(horse => (
                <option key={horse.horseNumber} value={horse.name}>
                  {horse.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            3着馬名:
            <select 
              value={result["3着"] || ""} 
              onChange={(e) => handleResultChange("3着", e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
              required
            >
              <option value="">選択してください</option>
              {race.horses.filter(horse => 
                horse.name !== result["1着"] && horse.name !== result["2着"]
              ).map(horse => (
                <option key={horse.horseNumber} value={horse.name}>
                  {horse.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        <div>
          <button type="submit" disabled={loading} style={{ marginRight: '10px', padding: '8px 16px' }}>
            {loading ? '登録中...' : '結果を登録'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 16px' }}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResultForm;