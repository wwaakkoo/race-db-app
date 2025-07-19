import React, { useState } from 'react';
import axios from 'axios';

type SimpleHorse = {
  horseNumber: number;
  name: string;
  popularity: number;
};

const SimpleRaceForm = () => {
  const [raceInfo, setRaceInfo] = useState({
    date: '',
    course: '',
    distance: '',
    surface: '芝',
    condition: '良',
    level: '1000万下'
  });

  const [horses, setHorses] = useState<SimpleHorse[]>([]);
  const [newHorse, setNewHorse] = useState({ horseNumber: '', name: '', popularity: '' });

  const addHorse = () => {
    if (newHorse.horseNumber && newHorse.name && newHorse.popularity) {
      setHorses([...horses, {
        horseNumber: parseInt(newHorse.horseNumber),
        name: newHorse.name,
        popularity: parseInt(newHorse.popularity)
      }]);
      setNewHorse({ horseNumber: '', name: '', popularity: '' });
    }
  };

  const removeHorse = (index: number) => {
    setHorses(horses.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (horses.length < 2) {
      alert('最低2頭の馬情報を入力してください');
      return;
    }

    try {
      // 統計用に必要な最小限の形式に変換
      const raceData = {
        date: raceInfo.date,
        course: raceInfo.course,
        distance: parseInt(raceInfo.distance),
        surface: raceInfo.surface,
        condition: raceInfo.condition,
        level: raceInfo.level,
        horses: horses.map(horse => ({
          frameNumber: horse.horseNumber, // 簡略化のため馬番をそのまま使用
          horseNumber: horse.horseNumber,
          name: horse.name,
          sex: '不明', // 統計に直接影響しない
          age: 4, // デフォルト値
          weight: 55, // デフォルト値
          jockey: '未設定', // 統計に直接影響しない
          odds: 5.0, // デフォルト値（人気から推定可）
          popularity: horse.popularity
        }))
      };

      await axios.post('/api/race', raceData);
      alert('レース情報を保存しました！');
      
      // フォームリセット
      setRaceInfo({
        date: '',
        course: '',
        distance: '',
        surface: '芝',
        condition: '良',
        level: '1000万下'
      });
      setHorses([]);
    } catch (error) {
      console.error('❌ 保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>レース情報入力（簡易版）</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            開催日:
            <input
              type="date"
              value={raceInfo.date}
              onChange={(e) => setRaceInfo({...raceInfo, date: e.target.value})}
              required
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            競馬場:
            <select
              value={raceInfo.course}
              onChange={(e) => setRaceInfo({...raceInfo, course: e.target.value})}
              required
              style={{ marginLeft: '10px' }}
            >
              <option value="">選択してください</option>
              <option value="東京">東京</option>
              <option value="阪神">阪神</option>
              <option value="中山">中山</option>
              <option value="京都">京都</option>
              <option value="小倉">小倉</option>
              <option value="函館">函館</option>
              <option value="福島">福島</option>
              <option value="中京">中京</option>
              <option value="札幌">札幌</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            距離(m):
            <input
              type="number"
              value={raceInfo.distance}
              onChange={(e) => setRaceInfo({...raceInfo, distance: e.target.value})}
              required
              min="1000"
              max="3000"
              step="200"
              style={{ marginLeft: '10px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            コース:
            <select
              value={raceInfo.surface}
              onChange={(e) => setRaceInfo({...raceInfo, surface: e.target.value})}
              style={{ marginLeft: '10px' }}
            >
              <option value="芝">芝</option>
              <option value="ダート">ダート</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            馬場状態:
            <select
              value={raceInfo.condition}
              onChange={(e) => setRaceInfo({...raceInfo, condition: e.target.value})}
              style={{ marginLeft: '10px' }}
            >
              <option value="良">良</option>
              <option value="稍重">稍重</option>
              <option value="重">重</option>
              <option value="不良">不良</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            クラス:
            <select
              value={raceInfo.level}
              onChange={(e) => setRaceInfo({...raceInfo, level: e.target.value})}
              style={{ marginLeft: '10px' }}
            >
              <option value="未勝利">未勝利</option>
              <option value="500万下">500万下</option>
              <option value="1000万下">1000万下</option>
              <option value="1600万下">1600万下</option>
              <option value="オープン">オープン</option>
              <option value="G3">G3</option>
              <option value="G2">G2</option>
              <option value="G1">G1</option>
            </select>
          </label>
        </div>

        <h3>出走馬情報</h3>
        
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="number"
              placeholder="馬番"
              value={newHorse.horseNumber}
              onChange={(e) => setNewHorse({...newHorse, horseNumber: e.target.value})}
              style={{ width: '80px', marginRight: '10px' }}
              min="1"
              max="18"
            />
            <input
              type="text"
              placeholder="馬名"
              value={newHorse.name}
              onChange={(e) => setNewHorse({...newHorse, name: e.target.value})}
              style={{ width: '150px', marginRight: '10px' }}
            />
            <input
              type="number"
              placeholder="人気"
              value={newHorse.popularity}
              onChange={(e) => setNewHorse({...newHorse, popularity: e.target.value})}
              style={{ width: '80px', marginRight: '10px' }}
              min="1"
              max="18"
            />
            <button type="button" onClick={addHorse} style={{ padding: '5px 10px' }}>
              追加
            </button>
          </div>
        </div>

        {horses.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>登録済み馬匹 ({horses.length}頭)</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>馬番</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>馬名</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>人気</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {horses.map((horse, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      {horse.horseNumber}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {horse.name}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      {horse.popularity}番人気
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <button type="button" onClick={() => removeHorse(index)}>削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>
          レースを保存
        </button>
      </form>
    </div>
  );
};

export default SimpleRaceForm;