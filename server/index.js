const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'races.json');

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
function calculatePopularityStats(races) {
  const stats = {};
  
  races.forEach(race => {
    if (!race.result) return;
    
    race.horses.forEach(horse => {
      const popularity = horse.popularity;
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

// ✅ GET: 統計情報を取得
app.get('/api/statistics', (_, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ 統計取得エラー:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました' });
    }

    try {
      const races = JSON.parse(data);
      const stats = calculatePopularityStats(races);
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

