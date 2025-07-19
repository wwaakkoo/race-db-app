// ローカルストレージ用APIサービス - GitHub Pages対応
export interface Horse {
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

export interface Race {
  id: string;
  date: string;
  course: string;
  distance: number;
  surface: string;
  condition: string;
  level: string;
  horses: Horse[];
  result?: {
    "1着"?: string;
    "2着"?: string;
    "3着"?: string;
  };
}

const STORAGE_KEY = 'racedb_data';

// サンプルデータ
const SAMPLE_DATA: Race[] = [
  {
    "id": "sample1",
    "date": "2024-01-15",
    "course": "東京",
    "distance": 1600,
    "surface": "芝",
    "condition": "良",
    "level": "1000万下",
    "horses": [
      {
        "frameNumber": 1,
        "horseNumber": 1,
        "name": "サンプル馬A",
        "sex": "牡",
        "age": 4,
        "weight": 480,
        "jockey": "佐藤騎手",
        "odds": 3.2,
        "popularity": 1
      },
      {
        "frameNumber": 2,
        "horseNumber": 2,
        "name": "サンプル馬B",
        "sex": "牝",
        "age": 3,
        "weight": 460,
        "jockey": "田中騎手",
        "odds": 5.1,
        "popularity": 2
      },
      {
        "frameNumber": 3,
        "horseNumber": 3,
        "name": "サンプル馬C",
        "sex": "牡",
        "age": 5,
        "weight": 490,
        "jockey": "鈴木騎手",
        "odds": 8.5,
        "popularity": 3
      }
    ],
    "result": {
      "1着": "サンプル馬A",
      "2着": "サンプル馬C",
      "3着": "サンプル馬B"
    }
  }
];

class LocalStorageApi {
  
  // 初期化（サンプルデータがない場合のみ）
  initialize() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
    }
  }

  // レース一覧取得
  async getRaces(): Promise<Race[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('レース一覧取得エラー:', error);
      return [];
    }
  }

  // レース保存
  async saveRace(race: Omit<Race, 'id'>): Promise<{ id: string }> {
    try {
      const races = await this.getRaces();
      const newRace: Race = {
        ...race,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11)
      };
      races.push(newRace);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(races));
      return { id: newRace.id };
    } catch (error) {
      console.error('レース保存エラー:', error);
      throw new Error('レースの保存に失敗しました');
    }
  }

  // レース結果更新
  async updateResult(raceId: string, result: Race['result']): Promise<void> {
    try {
      const races = await this.getRaces();
      const raceIndex = races.findIndex(race => race.id === raceId);
      if (raceIndex === -1) {
        throw new Error('レースが見つかりません');
      }
      races[raceIndex].result = result;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(races));
    } catch (error) {
      console.error('結果更新エラー:', error);
      throw new Error('結果の更新に失敗しました');
    }
  }

  // 統計情報計算
  async getStatistics(filters: any = {}): Promise<any> {
    try {
      const races = await this.getRaces();
      return this.calculatePopularityStats(races, filters);
    } catch (error) {
      console.error('統計取得エラー:', error);
      return {};
    }
  }

  // 騎手別統計
  async getJockeyStatistics(filters: any = {}): Promise<any> {
    try {
      const races = await this.getRaces();
      return this.calculateJockeyStats(races, filters);
    } catch (error) {
      console.error('騎手統計取得エラー:', error);
      return {};
    }
  }

  // データエクスポート
  async exportData(): Promise<any> {
    try {
      const races = await this.getRaces();
      return {
        exportDate: new Date().toISOString(),
        totalRaces: races.length,
        data: races
      };
    } catch (error) {
      console.error('エクスポートエラー:', error);
      throw new Error('データのエクスポートに失敗しました');
    }
  }

  // データインポート
  async importData(importData: any): Promise<{ imported: number; skipped: number; total: number }> {
    try {
      if (!importData.data || !Array.isArray(importData.data)) {
        throw new Error('インポートデータの形式が正しくありません');
      }

      const existingRaces = await this.getRaces();
      const newRaces = importData.data;
      let importedCount = 0;
      let skippedCount = 0;

      newRaces.forEach((newRace: Race) => {
        const exists = existingRaces.find(race => race.id === newRace.id);
        if (!exists) {
          if (!newRace.id) {
            newRace.id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
          }
          existingRaces.push(newRace);
          importedCount++;
        } else {
          skippedCount++;
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRaces));
      return {
        imported: importedCount,
        skipped: skippedCount,
        total: newRaces.length
      };
    } catch (error) {
      console.error('インポートエラー:', error);
      throw new Error('データのインポートに失敗しました');
    }
  }

  // 人気別統計計算
  private calculatePopularityStats(races: Race[], filters: any = {}) {
    const filteredRaces = this.filterRaces(races, filters);
    const stats: any = {};

    filteredRaces.forEach(race => {
      if (!race.result) return;

      race.horses.forEach(horse => {
        const popularity = horse.popularity;
        if (!stats[popularity]) {
          stats[popularity] = {
            total: 0,
            wins: 0,
            places: 0,
            shows: 0,
            winRate: "0.0",
            placeRate: "0.0",
            showRate: "0.0"
          };
        }

        stats[popularity].total++;

        if (race.result?.["1着"] === horse.name) stats[popularity].wins++;
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name) {
          stats[popularity].places++;
        }
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name || race.result?.["3着"] === horse.name) {
          stats[popularity].shows++;
        }
      });
    });

    // 率の計算
    Object.keys(stats).forEach(key => {
      const s = stats[key];
      s.winRate = s.total > 0 ? (s.wins / s.total * 100).toFixed(1) : "0.0";
      s.placeRate = s.total > 0 ? (s.places / s.total * 100).toFixed(1) : "0.0";
      s.showRate = s.total > 0 ? (s.shows / s.total * 100).toFixed(1) : "0.0";
    });

    return stats;
  }

  // 騎手別統計計算
  private calculateJockeyStats(races: Race[], filters: any = {}) {
    const filteredRaces = this.filterRaces(races, filters);
    const stats: any = {};

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
            shows: 0,
            winRate: "0.0",
            placeRate: "0.0",
            showRate: "0.0",
            avgField: 0,
            totalField: 0
          };
        }

        stats[jockey].total++;
        stats[jockey].totalField += race.horses.length;

        if (race.result?.["1着"] === horse.name) stats[jockey].wins++;
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name) {
          stats[jockey].places++;
        }
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name || race.result?.["3着"] === horse.name) {
          stats[jockey].shows++;
        }
      });
    });

    // 率の計算
    Object.keys(stats).forEach(key => {
      const s = stats[key];
      s.winRate = s.total > 0 ? (s.wins / s.total * 100).toFixed(1) : "0.0";
      s.placeRate = s.total > 0 ? (s.places / s.total * 100).toFixed(1) : "0.0";
      s.showRate = s.total > 0 ? (s.shows / s.total * 100).toFixed(1) : "0.0";
      s.avgField = s.total > 0 ? parseFloat((s.totalField / s.total).toFixed(1)) : 0;
    });

    return stats;
  }

  // フィルタリング
  private filterRaces(races: Race[], filters: any) {
    return races.filter(race => {
      if (filters.course) {
        const courses = Array.isArray(filters.course) ? filters.course : [filters.course];
        if (courses.length > 0 && !courses.includes(race.course)) return false;
      }
      if (filters.surface) {
        const surfaces = Array.isArray(filters.surface) ? filters.surface : [filters.surface];
        if (surfaces.length > 0 && !surfaces.includes(race.surface)) return false;
      }
      if (filters.distance) {
        const distances = Array.isArray(filters.distance) ? filters.distance.map((d: string) => parseInt(d)) : [parseInt(filters.distance)];
        if (distances.length > 0 && !distances.includes(race.distance)) return false;
      }
      if (filters.level) {
        const levels = Array.isArray(filters.level) ? filters.level : [filters.level];
        if (levels.length > 0 && !levels.includes(race.level)) return false;
      }
      return true;
    });
  }

  // シンプルな予測ロジック
  async predictRace(raceData: any, customWeights?: any): Promise<any> {
    try {
      const horses = raceData.horses || [];
      const weights = customWeights || {
        popularity: 0.4,
        jockey: 0.3,
        distance: 0.2,
        base: 0.1
      };

      // 統計データ取得
      const jockeyStats = await this.getJockeyStatistics();
      
      // 各馬の予測
      const predictions = horses.map((horse: Horse) => {
        let score = weights.base * 0.5; // ベーススコア

        // 人気による予測
        const popularityScore = Math.max(0, (1 - (horse.popularity - 1) / horses.length));
        score += weights.popularity * popularityScore;

        // 騎手統計による予測
        const jockeyData = jockeyStats[horse.jockey];
        if (jockeyData) {
          const jockeyScore = parseFloat(jockeyData.winRate) / 100;
          score += weights.jockey * jockeyScore;
        }

        // オッズによる調整
        const oddsScore = Math.max(0, (1 - Math.log(horse.odds) / Math.log(20)));
        score += weights.distance * oddsScore;

        // 正規化
        const normalizedScore = Math.min(1, Math.max(0, score));
        
        return {
          horse,
          predictedWinRate: normalizedScore,
          confidence: 0.6 + (normalizedScore * 0.3),
          factors: {
            popularity: { rate: popularityScore, weight: weights.popularity },
            jockey: { rate: jockeyData ? parseFloat(jockeyData.winRate) / 100 : 0, weight: weights.jockey },
            distance: { rate: oddsScore, weight: weights.distance }
          }
        };
      });

      // ソート
      predictions.sort((a: any, b: any) => b.predictedWinRate - a.predictedWinRate);

      const avgConfidence = predictions.reduce((sum: number, p: any) => sum + p.confidence, 0) / predictions.length;

      return {
        predictions,
        topRecommendations: predictions.slice(0, 5),
        averageConfidence: avgConfidence
      };
    } catch (error) {
      console.error('予測エラー:', error);
      throw new Error('予測処理中にエラーが発生しました');
    }
  }
}

export const localStorageApi = new LocalStorageApi();

// 初期化
if (typeof window !== 'undefined') {
  localStorageApi.initialize();
}