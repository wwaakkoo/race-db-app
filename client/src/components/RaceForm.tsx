import React, { useState } from 'react';
import axios from 'axios';

interface Prediction {
  horse: Horse;
  predictedWinRate: number;
  confidence: number;
  factors: {
    popularity: { rate: number; weight: number };
    jockey: { rate: number; weight: number };
    distance: { rate: number; weight: number };
  };
}

interface Strategy {
  type: string;
  target: string;
  reason: string;
  confidence: number;
  expectedValue: number | string;
  profitMargin?: number;
}

interface StrategyResponse {
  raceAnalysis: {
    predictions: Prediction[];
    topRecommendations: Prediction[];
    averageConfidence: number;
  };
  recommendedStrategies: Strategy[];
  riskLevel: 'low' | 'medium' | 'high';
}

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
const levels = ['新馬', '未勝利', '500万下', '1000万下', '1600万下', 'オープン', 'G3', 'G2', 'G1'];

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
  const [prediction, setPrediction] = useState<StrategyResponse | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [customWeights, setCustomWeights] = useState({
    popularity: 0.4,
    jockey: 0.3,
    distance: 0.2,
    base: 0.1
  });
  const [showWeightSettings, setShowWeightSettings] = useState(false);

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
        // 馬場と距離（ダートは「ダ」で抽出、「ダート」で表示）
        const surfaceDistanceMatch = p.match(/(芝|ダ)(\d+)m/);
        if (surfaceDistanceMatch) {
          surface = surfaceDistanceMatch[1] === 'ダ' ? 'ダート' : surfaceDistanceMatch[1];
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

    // ダートの場合も距離が自動設定されるように改善
    setRaceInfo(prev => {
      const newInfo = { ...prev, course, distance, surface, condition, level };
      // 馬場に応じて距離選択肢をチェック
      if (surface && distance) {
        const distanceOptions = getDistanceOptions(surface);
        if (!distanceOptions.includes(distance)) {
          // 距離が選択肢にない場合は空にする
          newInfo.distance = '';
        }
      }
      return newInfo;
    });
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
        
        // 次の行が区切り文字か予想印かをチェック（-- 以外にも ◎ ○ ▲ △ ☆ ✓ 消 に対応）
        const separatorPattern = /^(--|◎|◯|▲|△|☆|✓|消|)$/;
        if (i + 1 < lines.length && separatorPattern.test(lines[i + 1])) {
          const name = lines[i + 2];
          const infoLine = lines[i + 3];
          
          if (name && infoLine) {
            const parts = infoLine.split(/\t+/);

            if (parts.length >= 6) {
              const sexAge = parts[0];
              const weight = parseFloat(parts[1]);
              const jockey = parts[2];
              
              // 馬体重が含まれているかチェック（"454(0)"のような形式）
              let oddsIndex = 4;
              let popularityIndex = 5;
              
              // parts[4]が馬体重の形式（数字＋括弧）かチェック
              if (parts.length >= 7 && /^\d+\(\S*\)$/.test(parts[4])) {
                // 馬体重が含まれている場合、オッズと人気のインデックスをずらす
                oddsIndex = 5;
                popularityIndex = 6;
              }
              
              const odds = parseFloat(parts[oddsIndex]);
              const popularity = parseInt(parts[popularityIndex]);

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
      setPrediction(null);
    } catch (error) {
      console.error('❌ 保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // AI予測実行
  const runPrediction = async () => {
    try {
      setPredictLoading(true);
      const raceData = {
        course: raceInfo.course,
        distance: parseInt(raceInfo.distance),
        surface: raceInfo.surface,
        condition: raceInfo.condition,
        level: raceInfo.level,
        horses: horses
      };

      const requestBody = {
        raceData: raceData,
        weights: customWeights
      };

      const response = await axios.post('http://localhost:3001/api/analysis/strategy', requestBody);
      setPrediction(response.data);
    } catch (error) {
      console.error('❌ 予測エラー:', error);
      alert('予測処理に失敗しました');
    } finally {
      setPredictLoading(false);
    }
  };

  // 重み設定の変更
  const handleWeightChange = (factor: string, value: number) => {
    setCustomWeights(prev => ({
      ...prev,
      [factor]: value
    }));
  };

  // 重みのリセット
  const resetWeights = () => {
    setCustomWeights({
      popularity: 0.4,
      jockey: 0.3,
      distance: 0.2,
      base: 0.1
    });
  };

  // リスクレベル色取得
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#28a745';
      case 'medium': return '#ffc107';
      case 'high': return '#dc3545';
      default: return '#6c757d';
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
                      min="1"
                      max={horses.length}
                      title={`1～${horses.length}番人気の範囲で入力してください`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 予測機能セクション */}
      {horses.length > 0 && raceInfo.course && raceInfo.distance && raceInfo.surface && (
        <div style={{ marginTop: '30px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h2>🎯 AI予測機能</h2>
          <p>レース条件: {raceInfo.course} {raceInfo.distance}m {raceInfo.surface} ({horses.length}頭立て)</p>
          
          {/* 重み設定UI */}
          <div style={{ marginBottom: '15px' }}>
            <button
              type="button"
              onClick={() => setShowWeightSettings(!showWeightSettings)}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
                fontSize: '14px'
              }}
            >
              ⚙️ 重み設定 {showWeightSettings ? '▼' : '▶'}
            </button>
            
            {showWeightSettings && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '15px', 
                border: '1px solid #dee2e6', 
                borderRadius: '6px', 
                marginTop: '10px' 
              }}>
                <h4>予測要素の重み設定</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {Object.entries(customWeights).map(([factor, weight]) => (
                    <div key={factor}>
                      <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                        {factor === 'popularity' ? '人気' : 
                         factor === 'jockey' ? '騎手' : 
                         factor === 'distance' ? '距離' : 'ベース'}: {(weight * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weight}
                        onChange={(e) => handleWeightChange(factor, parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                  合計: {(Object.values(customWeights).reduce((sum, w) => sum + w, 0) * 100).toFixed(0)}% 
                  (自動正規化されます)
                </div>
                <button
                  type="button"
                  onClick={resetWeights}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    fontSize: '12px'
                  }}
                >
                  デフォルトに戻す
                </button>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={runPrediction}
            disabled={predictLoading}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: predictLoading ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
              fontSize: '16px'
            }}
          >
            {predictLoading ? '予測計算中...' : '🔮 予測実行'}
          </button>

          {prediction && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ 
                backgroundColor: getRiskColor(prediction.riskLevel),
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                display: 'inline-block',
                marginBottom: '15px'
              }}>
                リスクレベル: {prediction.riskLevel.toUpperCase()}
              </div>

              <h3>🏆 予測順位</h3>
              <div style={{ marginBottom: '20px' }}>
                {prediction.raceAnalysis.topRecommendations.map((pred, index) => (
                  <div 
                    key={index}
                    style={{
                      backgroundColor: index === 0 ? '#fff3cd' : '#f8f9fa',
                      padding: '12px',
                      margin: '5px 0',
                      borderRadius: '6px',
                      border: index === 0 ? '2px solid #ffc107' : '1px solid #dee2e6'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {index + 1}位: {pred.horse.name} ({pred.horse.jockey})
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
                      予測勝率: {(pred.predictedWinRate * 100).toFixed(1)}% | 
                      信頼度: {(pred.confidence * 100).toFixed(0)}% | 
                      オッズ: {pred.horse.odds}倍 | 
                      {pred.horse.popularity}番人気
                    </div>
                  </div>
                ))}
              </div>

              <h3>💰 推奨戦略</h3>
              {prediction.recommendedStrategies.length > 0 ? (
                <div>
                  {prediction.recommendedStrategies.map((strategy, index) => (
                    <div 
                      key={index}
                      style={{
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        padding: '12px',
                        margin: '8px 0',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#155724', fontSize: '16px' }}>
                        📋 {strategy.type}: {strategy.target}
                      </div>
                      <div style={{ fontSize: '14px', margin: '4px 0', color: '#155724' }}>
                        💡 {strategy.reason}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        信頼度: {(strategy.confidence * 100).toFixed(0)}% | 
                        期待値: {typeof strategy.expectedValue === 'number' ? 
                          strategy.expectedValue.toFixed(2) : strategy.expectedValue}
                        {strategy.profitMargin && ` (利益率${strategy.profitMargin >= 0 ? '+' : ''}${strategy.profitMargin}%)`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#6c757d', fontStyle: 'italic', padding: '10px' }}>
                  現在の条件では明確な推奨戦略がありません
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button type="submit" style={{ marginTop: 20, padding: '8px 16px' }}>
        保存
      </button>
    </form>
  );
};

export default RaceForm;
