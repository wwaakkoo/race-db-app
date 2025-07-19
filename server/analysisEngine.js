const fs = require('fs');

class RaceAnalysisEngine {
  constructor() {
    this.races = [];
    this.loadData();
  }

  loadData() {
    try {
      const data = fs.readFileSync('./races.json', 'utf8');
      this.races = JSON.parse(data);
      console.log(`📊 分析エンジン: ${this.races.length}件のレースデータを読み込みました`);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      this.races = [];
    }
  }

  // 勝利データのみを抽出
  getWinningHorses() {
    const winners = [];
    this.races.forEach(race => {
      if (race.result && race.result['1着']) {
        const winnerName = race.result['1着'];
        const winner = race.horses.find(h => h.name === winnerName);
        if (winner) {
          winners.push({
            ...winner,
            raceInfo: {
              date: race.date,
              course: race.course,
              distance: race.distance,
              surface: race.surface,
              condition: race.condition,
              level: race.level
            }
          });
        }
      }
    });
    return winners;
  }

  // 騎手別勝率を計算
  calculateJockeyWinRate() {
    const jockeyStats = {};
    const winners = this.getWinningHorses();
    
    // 全出走データを集計
    this.races.forEach(race => {
      race.horses.forEach(horse => {
        if (!jockeyStats[horse.jockey]) {
          jockeyStats[horse.jockey] = { wins: 0, runs: 0 };
        }
        jockeyStats[horse.jockey].runs++;
      });
    });

    // 勝利数を集計
    winners.forEach(winner => {
      if (jockeyStats[winner.jockey]) {
        jockeyStats[winner.jockey].wins++;
      }
    });

    // 勝率を計算
    Object.keys(jockeyStats).forEach(jockey => {
      const stats = jockeyStats[jockey];
      stats.winRate = stats.runs > 0 ? stats.wins / stats.runs : 0;
    });

    return jockeyStats;
  }

  // 人気別勝率を計算
  calculatePopularityWinRate() {
    const popularityStats = {};
    const winners = this.getWinningHorses();

    // 全出走データを集計
    this.races.forEach(race => {
      race.horses.forEach(horse => {
        const pop = horse.popularity;
        if (!popularityStats[pop]) {
          popularityStats[pop] = { wins: 0, runs: 0 };
        }
        popularityStats[pop].runs++;
      });
    });

    // 勝利数を集計
    winners.forEach(winner => {
      const pop = winner.popularity;
      if (popularityStats[pop]) {
        popularityStats[pop].wins++;
      }
    });

    // 勝率を計算
    Object.keys(popularityStats).forEach(pop => {
      const stats = popularityStats[pop];
      stats.winRate = stats.runs > 0 ? stats.wins / stats.runs : 0;
    });

    return popularityStats;
  }

  // 距離別勝率を計算
  calculateDistanceWinRate() {
    const distanceStats = {};
    const winners = this.getWinningHorses();

    // 全出走データを集計
    this.races.forEach(race => {
      const distance = race.distance;
      race.horses.forEach(horse => {
        if (!distanceStats[distance]) {
          distanceStats[distance] = { wins: 0, runs: 0 };
        }
        distanceStats[distance].runs++;
      });
    });

    // 勝利数を集計
    winners.forEach(winner => {
      const distance = winner.raceInfo.distance;
      if (distanceStats[distance]) {
        distanceStats[distance].wins++;
      }
    });

    // 勝率を計算
    Object.keys(distanceStats).forEach(distance => {
      const stats = distanceStats[distance];
      stats.winRate = stats.runs > 0 ? stats.wins / stats.runs : 0;
    });

    return distanceStats;
  }

  // 馬の勝率を予測
  predictHorseWinRate(horse, raceInfo, customWeights = null) {
    const jockeyStats = this.calculateJockeyWinRate();
    const popularityStats = this.calculatePopularityWinRate();
    const distanceStats = this.calculateDistanceWinRate();

    // 各要素の重み（カスタマイズ可能）
    const defaultWeights = {
      popularity: 0.4,
      jockey: 0.3,
      distance: 0.2,
      base: 0.1
    };
    
    const weights = customWeights || defaultWeights;
    
    // 重みの合計が1.0になるよう正規化
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight !== 1.0) {
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / totalWeight;
      });
    }

    // 人気による勝率
    const popularityRate = popularityStats[horse.popularity]?.winRate || 0;
    
    // 騎手による勝率
    const jockeyRate = jockeyStats[horse.jockey]?.winRate || 0;
    
    // 距離による勝率
    const distanceRate = distanceStats[raceInfo.distance]?.winRate || 0;
    
    // ベース勝率（全体平均）
    const baseRate = 1 / 16; // 平均16頭立てと仮定

    // 重み付き予測勝率
    const predictedRate = 
      popularityRate * weights.popularity +
      jockeyRate * weights.jockey +
      distanceRate * weights.distance +
      baseRate * weights.base;

    // 信頼度計算（サンプル数ベース）
    const jockeySamples = jockeyStats[horse.jockey]?.runs || 0;
    const popularitySamples = popularityStats[horse.popularity]?.runs || 0;
    const distanceSamples = distanceStats[raceInfo.distance]?.runs || 0;
    
    const confidence = Math.min(
      (jockeySamples + popularitySamples + distanceSamples) / (50 + 50 + 30), 
      1.0
    );

    return {
      predictedWinRate: predictedRate,
      confidence: confidence,
      factors: {
        popularity: { rate: popularityRate, weight: weights.popularity },
        jockey: { rate: jockeyRate, weight: weights.jockey },
        distance: { rate: distanceRate, weight: weights.distance }
      }
    };
  }

  // レース全体の予測
  predictRace(raceData, customWeights = null) {
    const predictions = raceData.horses.map(horse => {
      const prediction = this.predictHorseWinRate(horse, raceData, customWeights);
      return {
        horse: horse,
        ...prediction
      };
    });

    // 予測勝率で並び替え
    predictions.sort((a, b) => b.predictedWinRate - a.predictedWinRate);

    return {
      predictions,
      topRecommendations: predictions.slice(0, 3),
      averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    };
  }

  // 全体統計を取得
  getOverallStatistics() {
    const jockeyStats = this.calculateJockeyWinRate();
    const popularityStats = this.calculatePopularityWinRate();
    const distanceStats = this.calculateDistanceWinRate();

    return {
      totalRaces: this.races.length,
      totalHorses: this.races.reduce((sum, race) => sum + race.horses.length, 0),
      jockeyStats,
      popularityStats,
      distanceStats,
      topJockeys: Object.entries(jockeyStats)
        .filter(([_, stats]) => stats.runs >= 10)
        .sort((a, b) => b[1].winRate - a[1].winRate)
        .slice(0, 10)
        .map(([jockey, stats]) => ({ jockey, ...stats }))
    };
  }
}

module.exports = RaceAnalysisEngine;