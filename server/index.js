const express = require('express');
const cors = require('cors');
const RaceAnalysisEngine = require('./analysisEngine');
const app = express();
const PORT = 3001;
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'races.json');

// 分析エンジンのインスタンス作成
const analysisEngine = new RaceAnalysisEngine();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from RaceDB backend!');
});

app.post('/api/race', (req, res) => {
  console.log('📥 受信したレース情報:', req.body);

  // JSONファイルに現在のレース一覧を読み込み
  fs.readFile(DATA_PATH, 'utf-8', (err, data) => {
    let races = [];
    if (!err && data) {
      try {
        races = JSON.parse(data);
      } catch (e) {
        console.error('JSONパースエラー:', e);
      }
    }

    // 新しいレースにIDを追加
    const newRace = {
      ...req.body,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11)
    };

    // 新しいレースを追加
    races.push(newRace);

    // 書き戻し
    fs.writeFile(DATA_PATH, JSON.stringify(races, null, 2), (err) => {
      if (err) {
        console.error('❌ 保存失敗:', err);
        return res.status(500).json({ error: '保存に失敗しました' });
      }
      console.log('✅ 保存成功');
      res.status(200).json({ message: 'レース保存成功' });
    });
  });
});

// ✅ GET: 保存されたレース一覧を取得
app.get('/api/race', (req, res) => {
  const filePath = path.join(__dirname, 'races.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ レース一覧取得エラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      res.json(races);
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// 統計情報を計算する関数
function calculatePopularityStats(races, filters = {}) {
  // フィルタ条件に合致するレースのみ抽出
  const filteredRaces = races.filter(race => {
    // コースフィルタ（複数選択対応）
    if (filters.course) {
      const courses = Array.isArray(filters.course) ? filters.course : [filters.course];
      if (courses.length > 0 && !courses.includes(race.course)) return false;
    }
    // 馬場フィルタ（複数選択対応）
    if (filters.surface) {
      const surfaces = Array.isArray(filters.surface) ? filters.surface : [filters.surface];
      if (surfaces.length > 0 && !surfaces.includes(race.surface)) return false;
    }
    // 距離フィルタ（複数選択対応）
    if (filters.distance) {
      const distances = Array.isArray(filters.distance) ? filters.distance.map(d => parseInt(d)) : [parseInt(filters.distance)];
      if (distances.length > 0 && !distances.includes(race.distance)) return false;
    }
    // レベルフィルタ（複数選択対応）
    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      if (levels.length > 0 && !levels.includes(race.level)) return false;
    }
    return true;
  });
  
  const stats = {};
  
  filteredRaces.forEach(race => {
    if (!race.result) return;
    
    const horseCount = race.horses.length;
    
    race.horses.forEach(horse => {
      const popularity = horse.popularity;
      
      // データバリデーション: 人気は1～出走頭数の範囲内であること
      if (!popularity || popularity < 1 || popularity > horseCount) {
        console.warn(`無効な人気データ: ${horse.name} - 人気: ${popularity} (出走頭数: ${horseCount})`);
        return; // 無効なデータをスキップ
      }
      
      if (!stats[popularity]) {
        stats[popularity] = {
          total: 0,
          wins: 0,
          places: 0,
          shows: 0
        };
      }
      
      stats[popularity].total++;
      
      // 結果チェック
      const winner = race.result["1着"];
      const place = race.result["2着"];
      const show = race.result["3着"];
      
      if (horse.name === winner) {
        stats[popularity].wins++;
        stats[popularity].places++;
        stats[popularity].shows++;
      } else if (horse.name === place) {
        stats[popularity].places++;
        stats[popularity].shows++;
      } else if (horse.name === show) {
        stats[popularity].shows++;
      }
    });
  });
  
  // 勝率・連対率・複勝率を計算
  Object.keys(stats).forEach(popularity => {
    const s = stats[popularity];
    s.winRate = s.total > 0 ? (s.wins / s.total * 100).toFixed(1) : "0.0";
    s.placeRate = s.total > 0 ? (s.places / s.total * 100).toFixed(1) : "0.0";
    s.showRate = s.total > 0 ? (s.shows / s.total * 100).toFixed(1) : "0.0";
  });
  
  return stats;
}

// ✅ GET: 人気別統計情報を取得
app.get('/api/statistics', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ 統計取得エラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      const rawFilters = req.query;
      // axiosが配列パラメータを 'fieldname[]' 形式で送信するため、正規化する
      const filters = {
        course: rawFilters['course[]'] || rawFilters.course,
        surface: rawFilters['surface[]'] || rawFilters.surface,
        distance: rawFilters['distance[]'] || rawFilters.distance,
        level: rawFilters['level[]'] || rawFilters.level
      };
      console.log('🔍 正規化後フィルタ:', filters);
      const stats = calculatePopularityStats(races, filters);
      res.json(stats);
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// 騎手別統計を計算する関数
function calculateJockeyStats(races, filters = {}) {
  // フィルタ条件に合致するレースのみ抽出
  const filteredRaces = races.filter(race => {
    // コースフィルタ（複数選択対応）
    if (filters.course) {
      const courses = Array.isArray(filters.course) ? filters.course : [filters.course];
      if (courses.length > 0 && !courses.includes(race.course)) return false;
    }
    // 馬場フィルタ（複数選択対応）
    if (filters.surface) {
      const surfaces = Array.isArray(filters.surface) ? filters.surface : [filters.surface];
      if (surfaces.length > 0 && !surfaces.includes(race.surface)) return false;
    }
    // 距離フィルタ（複数選択対応）
    if (filters.distance) {
      const distances = Array.isArray(filters.distance) ? filters.distance.map(d => parseInt(d)) : [parseInt(filters.distance)];
      if (distances.length > 0 && !distances.includes(race.distance)) return false;
    }
    // レベルフィルタ（複数選択対応）
    if (filters.level) {
      const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
      if (levels.length > 0 && !levels.includes(race.level)) return false;
    }
    return true;
  });
  
  const stats = {};
  
  filteredRaces.forEach(race => {
    if (!race.result) return;
    
    race.horses.forEach(horse => {
      const jockey = horse.jockey;
      if (!jockey) return;
      
      if (!stats[jockey]) {
        stats[jockey] = {
          total: 0,
          wins: 0,
          places: 0,
          shows: 0
        };
      }
      
      stats[jockey].total++;
      
      // 結果チェック
      const winner = race.result["1着"];
      const place = race.result["2着"];
      const show = race.result["3着"];
      
      if (horse.name === winner) {
        stats[jockey].wins++;
        stats[jockey].places++;
        stats[jockey].shows++;
      } else if (horse.name === place) {
        stats[jockey].places++;
        stats[jockey].shows++;
      } else if (horse.name === show) {
        stats[jockey].shows++;
      }
    });
  });
  
  // 勝率・連対率・複勝率を計算
  Object.keys(stats).forEach(jockey => {
    const s = stats[jockey];
    s.winRate = s.total > 0 ? (s.wins / s.total * 100).toFixed(1) : "0.0";
    s.placeRate = s.total > 0 ? (s.places / s.total * 100).toFixed(1) : "0.0";
    s.showRate = s.total > 0 ? (s.shows / s.total * 100).toFixed(1) : "0.0";
  });
  
  return stats;
}

// コース別統計を計算する関数
function calculateCourseStats(races) {
  const stats = {};
  
  races.forEach(race => {
    if (!race.result || !race.course) return;
    
    const course = race.course;
    if (!stats[course]) {
      stats[course] = {
        totalRaces: 0,
        avgField: 0,
        surfaces: {},
        distances: {},
        levels: {}
      };
    }
    
    stats[course].totalRaces++;
    stats[course].avgField = ((stats[course].avgField * (stats[course].totalRaces - 1)) + race.horses.length) / stats[course].totalRaces;
    
    // 馬場別集計
    const surface = race.surface;
    if (!stats[course].surfaces[surface]) {
      stats[course].surfaces[surface] = 0;
    }
    stats[course].surfaces[surface]++;
    
    // 距離別集計
    const distance = race.distance;
    if (!stats[course].distances[distance]) {
      stats[course].distances[distance] = 0;
    }
    stats[course].distances[distance]++;
    
    // レベル別集計
    const level = race.level;
    if (!stats[course].levels[level]) {
      stats[course].levels[level] = 0;
    }
    stats[course].levels[level]++;
  });
  
  // 平均出走頭数を小数点1桁に
  Object.keys(stats).forEach(course => {
    stats[course].avgField = parseFloat(stats[course].avgField.toFixed(1));
  });
  
  return stats;
}

// 距離別統計を計算する関数
function calculateDistanceStats(races) {
  const stats = {};
  
  races.forEach(race => {
    if (!race.result || !race.distance) return;
    
    const distance = race.distance;
    const surface = race.surface;
    const key = `${surface}${distance}m`;
    
    if (!stats[key]) {
      stats[key] = {
        surface,
        distance,
        totalRaces: 0,
        avgField: 0,
        courses: {}
      };
    }
    
    stats[key].totalRaces++;
    stats[key].avgField = ((stats[key].avgField * (stats[key].totalRaces - 1)) + race.horses.length) / stats[key].totalRaces;
    
    // コース別集計
    const course = race.course;
    if (!stats[key].courses[course]) {
      stats[key].courses[course] = 0;
    }
    stats[key].courses[course]++;
  });
  
  // 平均出走頭数を小数点1桁に
  Object.keys(stats).forEach(key => {
    stats[key].avgField = parseFloat(stats[key].avgField.toFixed(1));
  });
  
  return stats;
}

// ✅ GET: 騎手別統計情報を取得
app.get('/api/statistics/jockey', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ 騎手別統計取得エラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      const rawFilters = req.query;
      // axiosが配列パラメータを 'fieldname[]' 形式で送信するため、正規化する
      const filters = {
        course: rawFilters['course[]'] || rawFilters.course,
        surface: rawFilters['surface[]'] || rawFilters.surface,
        distance: rawFilters['distance[]'] || rawFilters.distance,
        level: rawFilters['level[]'] || rawFilters.level
      };
      console.log('🔍 騎手統計正規化後フィルタ:', filters);
      const stats = calculateJockeyStats(races, filters);
      res.json(stats);
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// ✅ GET: コース別統計情報を取得
app.get('/api/statistics/course', (_, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ コース別統計取得エラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      const stats = calculateCourseStats(races);
      res.json(stats);
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// ✅ GET: 距離別統計情報を取得
app.get('/api/statistics/distance', (_, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ 距離別統計取得エラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      const stats = calculateDistanceStats(races);
      res.json(stats);
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// ✅ PUT: レース結果を更新
app.put('/api/race/:id/result', (req, res) => {
  const raceId = req.params.id;
  const result = req.body;
  
  console.log('📝 レース結果更新:', raceId, result);

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ ファイル読み込みエラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      const raceIndex = races.findIndex(race => race.id === raceId);
      
      if (raceIndex === -1) {
        return res.status(404).json({ error: 'レースが見つかりません' });
      }

      // 結果を更新
      races[raceIndex].result = result;

      // ファイルに保存
      fs.writeFile(DATA_PATH, JSON.stringify(races, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('❌ 保存失敗:', writeErr);
          return res.status(500).json({ error: '保存に失敗しました' });
        }
        
        console.log('✅ 結果更新成功');
        res.json({ message: 'レース結果が更新されました', race: races[raceIndex] });
      });

    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// ✅ GET: データエクスポート（JSON形式）
app.get('/api/export/json', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ エクスポートエラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      
      // ファイル名に日時を含める
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `racedb_export_${timestamp}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json({
        exportDate: new Date().toISOString(),
        totalRaces: races.length,
        data: races
      });
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// ✅ GET: データエクスポート（CSV形式）
app.get('/api/export/csv', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ エクスポートエラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      
      // CSV形式に変換
      const csvHeaders = [
        'レースID', '開催日', 'コース', '距離', '馬場', '馬場状態', 'レベル',
        '馬名', '枠番', '馬番', '性別', '年齢', '斤量', '騎手', 'オッズ', '人気',
        '1着', '2着', '3着'
      ];
      
      let csvContent = csvHeaders.join(',') + '\n';
      
      races.forEach(race => {
        const result1 = race.result ? race.result['1着'] || '' : '';
        const result2 = race.result ? race.result['2着'] || '' : '';
        const result3 = race.result ? race.result['3着'] || '' : '';
        
        race.horses.forEach(horse => {
          const row = [
            race.id,
            race.date,
            race.course,
            race.distance,
            race.surface,
            race.condition,
            race.level || '',
            horse.name,
            horse.frameNumber,
            horse.horseNumber,
            horse.sex,
            horse.age,
            horse.weight,
            horse.jockey,
            horse.odds,
            horse.popularity,
            result1,
            result2,
            result3
          ];
          csvContent += row.map(field => `"${field}"`).join(',') + '\n';
        });
      });
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `racedb_export_${timestamp}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csvContent); // UTF-8 BOM for Excel compatibility
    } catch (parseErr) {
      console.error('❌ JSONパースエラー:', parseErr);
      res.status(500).json({ error: 'JSONパースに失敗しました' });
    }
  });
});

// ✅ POST: データインポート（JSON形式）
app.post('/api/import/json', (req, res) => {
  try {
    const importData = req.body;
    
    // データ形式の検証
    if (!importData.data || !Array.isArray(importData.data)) {
      return res.status(400).json({ error: 'インポートデータの形式が正しくありません' });
    }
    
    // 既存データを読み込み
    fs.readFile(DATA_PATH, 'utf8', (err, data) => {
      let existingRaces = [];
      if (!err && data) {
        try {
          existingRaces = JSON.parse(data);
        } catch (e) {
          console.error('既存データ読み込みエラー:', e);
        }
      }
      
      const newRaces = importData.data;
      let importedCount = 0;
      let skippedCount = 0;
      
      newRaces.forEach(newRace => {
        // IDによる重複チェック
        const exists = existingRaces.find(race => race.id === newRace.id);
        if (!exists) {
          // IDがない場合は新規生成
          if (!newRace.id) {
            newRace.id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
          }
          existingRaces.push(newRace);
          importedCount++;
        } else {
          skippedCount++;
        }
      });
      
      // ファイルに保存
      fs.writeFile(DATA_PATH, JSON.stringify(existingRaces, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('❌ インポート保存失敗:', writeErr);
          return res.status(500).json({ error: 'データの保存に失敗しました' });
        }
        
        console.log(`✅ インポート成功: ${importedCount}件追加, ${skippedCount}件スキップ`);
        res.json({
          message: 'インポートが完了しました',
          imported: importedCount,
          skipped: skippedCount,
          total: newRaces.length
        });
      });
    });
  } catch (error) {
    console.error('❌ インポートエラー:', error);
    res.status(500).json({ error: 'インポート処理中にエラーが発生しました' });
  }
});

// ✅ GET: 分析概要統計を取得
app.get('/api/analysis/summary', (req, res) => {
  try {
    const stats = analysisEngine.getOverallStatistics();
    res.json(stats);
  } catch (error) {
    console.error('❌ 分析概要取得エラー:', error);
    res.status(500).json({ error: '分析データの取得に失敗しました' });
  }
});

// ✅ POST: レース予測を実行
app.post('/api/analysis/predict', (req, res) => {
  try {
    const raceData = req.body;
    
    // 入力データの検証
    if (!raceData.horses || !Array.isArray(raceData.horses)) {
      return res.status(400).json({ error: '馬データが不正です' });
    }
    
    const prediction = analysisEngine.predictRace(raceData);
    res.json(prediction);
  } catch (error) {
    console.error('❌ レース予測エラー:', error);
    res.status(500).json({ error: '予測処理中にエラーが発生しました' });
  }
});

// ✅ POST: 戦略推奨を取得
app.post('/api/analysis/strategy', (req, res) => {
  try {
    const { raceData, weights } = req.body;
    
    // リクエストボディの構造を確認（後方互換性）
    const actualRaceData = raceData || req.body;
    const customWeights = weights || null;
    
    const prediction = analysisEngine.predictRace(actualRaceData, customWeights);
    
    // 戦略推奨ロジック
    const strategies = [];
    
    // 単勝推奨（期待値フィルター採用）
    const topPick = prediction.topRecommendations[0];
    if (topPick) {
      const expectedValue = topPick.horse.odds * topPick.predictedWinRate;
      const profitMargin = ((expectedValue - 1) * 100).toFixed(1);
      
      // 期待値 > 1.0 かつ 信頼度 > 60% で推奨
      if (expectedValue > 1.0 && topPick.confidence > 0.6) {
        strategies.push({
          type: '単勝',
          target: topPick.horse.name,
          reason: `期待値${expectedValue.toFixed(2)}(利益率+${profitMargin}%) 信頼度${(topPick.confidence * 100).toFixed(0)}%`,
          confidence: topPick.confidence,
          expectedValue: expectedValue,
          profitMargin: parseFloat(profitMargin)
        });
      }
      
      // 期待値は低いが高信頼度・高勝率の場合は安全策として推奨
      else if (topPick.confidence > 0.8 && topPick.predictedWinRate > 0.2) {
        strategies.push({
          type: '単勝（安全策）',
          target: topPick.horse.name,
          reason: `高信頼度${(topPick.confidence * 100).toFixed(0)}%・高勝率${(topPick.predictedWinRate * 100).toFixed(1)}% (期待値${expectedValue.toFixed(2)})`,
          confidence: topPick.confidence,
          expectedValue: expectedValue,
          profitMargin: parseFloat(profitMargin)
        });
      }
    }
    
    // 複勝推奨（上位3頭）
    const top3 = prediction.topRecommendations;
    if (top3.length >= 3) {
      const avgConfidence = top3.reduce((sum, p) => sum + p.confidence, 0) / 3;
      const avgWinRate = top3.reduce((sum, p) => sum + p.predictedWinRate, 0) / 3;
      
      // 複勝期待値は簡易計算（実際は複勝オッズが必要）
      const estimatedShowRate = avgWinRate * 2.5; // 複勝率は勝率の約2.5倍と仮定
      const estimatedShowOdds = 1.8; // 複勝オッズの平均値と仮定
      const complexExpectedValue = estimatedShowOdds * Math.min(estimatedShowRate, 1.0);
      
      if (avgConfidence > 0.65) {
        strategies.push({
          type: '複勝',
          target: top3.map(p => p.horse.name).join(', '),
          reason: `上位3頭戦略 平均信頼度${(avgConfidence * 100).toFixed(0)}% 推定複勝率${(estimatedShowRate * 100).toFixed(1)}%`,
          confidence: avgConfidence,
          expectedValue: complexExpectedValue.toFixed(2),
          profitMargin: ((complexExpectedValue - 1) * 100).toFixed(1)
        });
      }
    }
    
    // 穴馬推奨（高期待値の中〜下位馬）
    const candidates = prediction.predictions.slice(1, 6); // 2-6位から選択
    const darkHorse = candidates.find(p => {
      const expectedValue = p.horse.odds * p.predictedWinRate;
      return expectedValue > 1.5 && p.confidence > 0.5 && p.horse.odds > 5.0;
    });
    
    if (darkHorse) {
      const expectedValue = darkHorse.horse.odds * darkHorse.predictedWinRate;
      strategies.push({
        type: '穴馬単勝',
        target: darkHorse.horse.name,
        reason: `高期待値${expectedValue.toFixed(2)}の穴馬 ${darkHorse.horse.odds}倍 予測勝率${(darkHorse.predictedWinRate * 100).toFixed(1)}%`,
        confidence: darkHorse.confidence,
        expectedValue: expectedValue,
        profitMargin: ((expectedValue - 1) * 100).toFixed(1)
      });
    }
    
    res.json({
      raceAnalysis: prediction,
      recommendedStrategies: strategies,
      riskLevel: prediction.averageConfidence > 0.8 ? 'low' : 
                 prediction.averageConfidence > 0.6 ? 'medium' : 'high'
    });
  } catch (error) {
    console.error('❌ 戦略推奨エラー:', error);
    res.status(500).json({ error: '戦略分析中にエラーが発生しました' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

