import React, { useState } from 'react';
import axios from 'axios';

type Horse = {
  frameNumber: number;
  horseNumber: number;
  name: string;
  sex: string;
  age: number;
  weight: number;
  jockey: string;
  odds: number;
  popularity: number;
};

const courses = ['東京', '中山', '京都', '阪神', '新潟', '中京', '札幌', '函館', '福島', '小倉'];

// 芝コース距離（実績ベース）
const turfDistances = [
  '1000', '1200', '1400', '1500', '1600', '1800', 
  '2000', '2200', '2300', '2400', '2500', '2600', 
  '3000', '3200', '3400', '3600'
];

// ダートコース距離（実績ベース）
const dirtDistances = [
  '1000', '1150', '1200', '1400', '1600', '1700', 
  '1800', '1900', '2100', '2400'
];

// 馬場別距離選択肢を取得
const getDistanceOptions = (surface: string) => {
  return surface === 'ダート' ? dirtDistances : turfDistances;
};
const surfaces = ['芝', 'ダート'];
const conditions = ['良', '稍重', '重', '不良'];
const levels = ['未勝利', '500万下', '1000万下', '1600万下', 'オープン', 'G3', 'G2', 'G1'];

const RaceForm = () => {
  const [raceInfo, setRaceInfo] = useState({
    date: '',
    course: '',
    distance: '',
    surface: '',
    condition: '',
    level: ''
  });

  const [horseText, setHorseText] = useState('');
  const [horses, setHorses] = useState<Horse[]>([]);

  // レース情報自動抽出
  const extractRaceInfo = (text: string) => {
    // 例のレース情報テキストの１〜２行目を想定
    // 七夕賞  
    // 15:45発走 / 芝2000m (右 B) / 天候:晴 / 馬場:良
    // 2回 福島 6日目 サラ系３歳以上 オープン       (国際)(特指) ハンデ 15頭
    // 本賞金:4300,1700,1100,650,430万円

    const lines = text.split('\n').map(l => l.trim());
    let course = '';
    let distance = '';
    let surface = '';
    let condition = '';
    let level = '';

    // 2行目解析例：「15:45発走 / 芝2000m (右 B) / 天候:晴 / 馬場:良」
    if (lines.length > 1) {
      const parts = lines[1].split('/').map(s => s.trim());
      for (const p of parts) {
        // 馬場と距離
        const surfaceDistanceMatch = p.match(/(芝|ダート)(\d+)m/);
        if (surfaceDistanceMatch) {
          surface = surfaceDistanceMatch[1];
          distance = surfaceDistanceMatch[2];
          continue;
        }
        // 馬場状態
        const conditionMatch = p.match(/馬場:(良|稍重|重|不良)/);
        if (conditionMatch) {
          condition = conditionMatch[1];
          continue;
        }
      }
    }

    // 3行目解析例：「2回 福島 6日目 サラ系３歳以上 オープン       (国際)(特指) ハンデ 15頭」
    if (lines.length > 2) {
      const line3 = lines[2];
      // コースは「福島」など地名で判定
      for (const c of courses) {
        if (line3.includes(c)) {
          course = c;
          break;
        }
      }
      // レースレベル（単語で判定）
      for (const l of levels) {
        if (line3.includes(l)) {
          level = l;
          break;
        }
      }
    }

    setRaceInfo(prev => ({ ...prev, course, distance, surface, condition, level }));
  };

  // 馬データ抽出関数
  const extractHorseData = () => {
    console.log('抽出開始');
    const horses: Horse[] = [];

    const lines = horseText.split('\n').map(line => line.trim());

    for (let i = 0; i < lines.length; i++) {
      const frameHorseMatch = lines[i].match(/^(\d+)\s+(\d+)$/);
      if (frameHorseMatch) {
        const frameNumber = parseInt(frameHorseMatch[1]);
        const horseNumber = parseInt(frameHorseMatch[2]);
        if (lines[i + 1] === '--') {
          const name = lines[i + 2];
          const infoLine = lines[i + 3];
          const parts = infoLine.split(/\t+/);

          if (parts.length >= 6) {
            const sexAge = parts[0];
            const weight = parseFloat(parts[1]);
            const jockey = parts[2];
            const odds = parseFloat(parts[4]);
            const popularity = parseInt(parts[5]);

            const sex = sexAge.slice(0, 1);
            const age = parseInt(sexAge.slice(1));

            horses.push({
              frameNumber,
              horseNumber,
              name,
              sex,
              age,
              weight,
              jockey,
              odds,
              popularity
            });

            i += 3;
          }
        }
      }
    }

    console.log('抽出結果:', horses);
    setHorses(horses);
  };

  // 馬情報編集用ハンドラー
  const handleHorseChange = (index: number, field: keyof Horse, value: string | number) => {
    setHorses(prev => {
      const newHorses = [...prev];
      if (field === 'frameNumber' || field === 'horseNumber' || field === 'age' || field === 'popularity') {
        newHorses[index][field] = Number(value);
      } else if (field === 'weight' || field === 'odds') {
        newHorses[index][field] = parseFloat(String(value));
      } else {
        newHorses[index][field] = String(value);
      }
      return newHorses;
    });
  };

  // raceInfo編集用ハンドラー
  const handleRaceChange = (key: keyof typeof raceInfo, value: string) => {
    if (key === 'surface') {
      // 馬場変更時は距離をリセット（選択距離が新しい馬場で利用できない場合に備えて）
      const newDistanceOptions = getDistanceOptions(value);
      setRaceInfo(prev => ({
        ...prev,
        [key]: value,
        distance: newDistanceOptions.includes(prev.distance) ? prev.distance : ''
      }));
    } else {
      setRaceInfo(prev => ({ ...prev, [key]: value }));
    }
  };

  // テキスト入力時にレース情報も抽出する
  const onHorseTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHorseText(val);
    extractRaceInfo(val);
  };

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // これが **ないと二重送信** されます
    try {
      // 現在の型定義に合わせてデータを変換
      const raceData = {
        date: raceInfo.date,
        course: raceInfo.course,
        distance: parseInt(raceInfo.distance),
        surface: raceInfo.surface,
        condition: raceInfo.condition,
        level: raceInfo.level,
        horses: horses
      };

      const response = await axios.post('/api/race', raceData);
  
      console.log('✅ 保存成功:', response.data);
      alert('レース情報を保存しました！');
      
      // フォームリセット
      setRaceInfo({
        date: '',
        course: '',
        distance: '',
        surface: '',
        condition: '',
        level: ''
      });
      setHorses([]);
      setHorseText('');
    } catch (error) {
      console.error('❌ 保存エラー:', error);
      alert('保存に失敗しました');
    }
  };
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h2>レース情報選択</h2>

      <div style={{ marginBottom: '15px' }}>
        <label>開催日: </label>
        <input
          type="date"
          value={raceInfo.date}
          onChange={(e) => handleRaceChange('date', e.target.value)}
          style={{ marginLeft: '10px', padding: '5px' }}
          required
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>コース: </label>
        <div>
          {courses.map(c => (
            <button
              type="button"
              key={c}
              onClick={() => handleRaceChange('course', c)}
              style={{
                margin: 4,
                padding: '6px 12px',
                backgroundColor: raceInfo.course === c ? '#007bff' : 'white',
                color: raceInfo.course === c ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>馬場: </label>
        <div>
          {surfaces.map(s => (
            <button
              type="button"
              key={s}
              onClick={() => handleRaceChange('surface', s)}
              style={{
                margin: 4,
                padding: '6px 12px',
                backgroundColor: raceInfo.surface === s ? '#007bff' : 'white',
                color: raceInfo.surface === s ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>距離: </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {getDistanceOptions(raceInfo.surface).map(d => (
            <button
              type="button"
              key={d}
              onClick={() => handleRaceChange('distance', d)}
              style={{
                padding: '4px 8px',
                backgroundColor: raceInfo.distance === d ? '#007bff' : 'white',
                color: raceInfo.distance === d ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {d}m
            </button>
          ))}
        </div>
        {raceInfo.surface && (
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            {raceInfo.surface === 'ダート' ? 'ダートコース設定距離' : '芝コース設定距離'}
          </small>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>馬場状態: </label>
        <div>
          {conditions.map(c => (
            <button
              type="button"
              key={c}
              onClick={() => handleRaceChange('condition', c)}
              style={{
                margin: 4,
                padding: '6px 12px',
                backgroundColor: raceInfo.condition === c ? '#007bff' : 'white',
                color: raceInfo.condition === c ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>レースレベル: </label>
        <div>
          {levels.map(l => (
            <button
              type="button"
              key={l}
              onClick={() => handleRaceChange('level', l)}
              style={{
                margin: 4,
                padding: '6px 12px',
                backgroundColor: raceInfo.level === l ? '#007bff' : 'white',
                color: raceInfo.level === l ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <h2>馬情報コピペ入力</h2>
      <textarea
        rows={10}
        style={{ width: '100%', fontFamily: 'monospace' }}
        value={horseText}
        onChange={onHorseTextChange}
        placeholder="netkeibaなどの馬情報テキストをここに貼り付けてください。先頭にレース情報があれば自動で読み取ります。"
      />

      <button type="button" onClick={extractHorseData} style={{ marginTop: 10, padding: '6px 12px' }}>
        抽出して編集フォームに反映
      </button>

      {horses.length > 0 && (
        <>
          <h2>馬データ編集</h2>
          <table border={1} cellPadding={4} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>枠番</th>
                <th>馬番</th>
                <th>馬名</th>
                <th>性別</th>
                <th>年齢</th>
                <th>斤量(kg)</th>
                <th>騎手</th>
                <th>単勝オッズ</th>
                <th>人気</th>
              </tr>
            </thead>
            <tbody>
              {horses.map((h, i) => (
                <tr key={`${h.frameNumber}-${h.horseNumber}`}>
                  <td>
                    <input
                      type="number"
                      value={h.frameNumber}
                      onChange={e => handleHorseChange(i, 'frameNumber', e.target.value)}
                      style={{ width: '50px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={h.horseNumber}
                      onChange={e => handleHorseChange(i, 'horseNumber', e.target.value)}
                      style={{ width: '50px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={h.name}
                      onChange={e => handleHorseChange(i, 'name', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={h.sex}
                      onChange={e => handleHorseChange(i, 'sex', e.target.value)}
                    >
                      <option value="牡">牡</option>
                      <option value="牝">牝</option>
                      <option value="セ">セ</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={h.age}
                      onChange={e => handleHorseChange(i, 'age', e.target.value)}
                      style={{ width: '40px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={h.weight}
                      onChange={e => handleHorseChange(i, 'weight', e.target.value)}
                      style={{ width: '60px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={h.jockey}
                      onChange={e => handleHorseChange(i, 'jockey', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={h.odds}
                      onChange={e => handleHorseChange(i, 'odds', e.target.value)}
                      style={{ width: '60px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={h.popularity}
                      onChange={e => handleHorseChange(i, 'popularity', e.target.value)}
                      style={{ width: '40px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <button type="submit" style={{ marginTop: 20, padding: '8px 16px' }}>
        保存
      </button>
    </form>
  );
};

export default RaceForm;
