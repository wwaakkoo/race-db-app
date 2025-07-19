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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
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
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

