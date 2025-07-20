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

  // レース削除
  async deleteRace(raceId: string): Promise<void> {
    try {
      const races = await this.getRaces();
      const filteredRaces = races.filter(race => race.id !== raceId);
      if (filteredRaces.length === races.length) {
        throw new Error('削除対象のレースが見つかりません');
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRaces));
    } catch (error) {
      console.error('レース削除エラー:', error);
      throw new Error('レースの削除に失敗しました');
    }
  }

  // 全データクリア
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('データクリアエラー:', error);
      throw new Error('データのクリアに失敗しました');
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

  // 馬番別統計
  async getHorseNumberStatistics(filters: any = {}): Promise<any> {
    try {
      const races = await this.getRaces();
      return this.calculateHorseNumberStats(races, filters);
    } catch (error) {
      console.error('馬番別統計取得エラー:', error);
      return {};
    }
  }

  // 統計ベース重み計算
  async calculateOptimalWeights(): Promise<{ popularity: number; jockey: number; odds: number; base: number }> {
    try {
      const races = await this.getRaces();
      
      // 各要素の精度を計算
      const popularityAccuracy = this.calculatePopularityAccuracy(races);
      const jockeyAccuracy = this.calculateJockeyAccuracy(races);
      const oddsAccuracy = this.calculateOddsAccuracy(races);
      const baseAccuracy = 0.05; // ベース値

      console.log('📊 精度分析結果:', {
        人気: `${(popularityAccuracy * 100).toFixed(1)}%`,
        騎手: `${(jockeyAccuracy * 100).toFixed(1)}%`,
        オッズ: `${(oddsAccuracy * 100).toFixed(1)}%`
      });

      // 重みを正規化（合計1.0になるように調整）
      const total = popularityAccuracy + jockeyAccuracy + oddsAccuracy + baseAccuracy;
      
      return {
        popularity: popularityAccuracy / total,
        jockey: jockeyAccuracy / total,
        odds: oddsAccuracy / total,
        base: baseAccuracy / total
      };
    } catch (error) {
      console.error('重み計算エラー:', error);
      // エラー時はデフォルト値を返す
      return { popularity: 0.4, jockey: 0.3, odds: 0.2, base: 0.1 };
    }
  }

  // 条件別重み計算
  async calculateConditionBasedWeights(raceConditions: {
    surface: string;
    distance: number;
    course: string;
  }): Promise<{ popularity: number; jockey: number; odds: number; base: number }> {
    try {
      const races = await this.getRaces();
      
      // 期間情報を分析
      const periodInfo = this.analyzePeriodInfo(races);
      
      // 類似条件のレースを抽出
      const similarRaces = races.filter(race => {
        let score = 0;
        
        // 馬場が同じ（重要度：高）
        if (race.surface === raceConditions.surface) score += 3;
        
        // 距離が近い（±200m以内で重要度：中）
        const distanceDiff = Math.abs(race.distance - raceConditions.distance);
        if (distanceDiff <= 200) score += 2;
        else if (distanceDiff <= 400) score += 1;
        
        // コースが同じ（重要度：低）
        if (race.course === raceConditions.course) score += 1;
        
        // スコア2以上を類似条件とする
        return score >= 2 && race.result; // 結果があるレースのみ
      });

      // 季節情報を分析
      const seasonInfo = this.analyzeSeasonalData(similarRaces, raceConditions);

      console.log(`🎯 条件分析: ${raceConditions.surface} ${raceConditions.distance}m (${raceConditions.course})`);
      console.log(`📅 分析期間: ${periodInfo.dateRange} (全${races.length}件)`);
      console.log(`📈 類似レース: ${similarRaces.length}件 ${seasonInfo.seasonNote}`);
      console.log(seasonInfo.detailLog);

      if (similarRaces.length < 3) {
        // データ不足時は条件別プリセットを使用
        return this.getConditionPresetWeights(raceConditions);
      }

      // 類似レースから精度計算
      const popularityAccuracy = this.calculatePopularityAccuracy(similarRaces);
      const jockeyAccuracy = this.calculateJockeyAccuracy(similarRaces);
      const oddsAccuracy = this.calculateOddsAccuracy(similarRaces);
      const baseAccuracy = 0.05;

      // 条件別補正を適用
      const adjustedWeights = this.applyConditionAdjustments({
        popularity: popularityAccuracy,
        jockey: jockeyAccuracy,
        odds: oddsAccuracy,
        base: baseAccuracy
      }, raceConditions);

      // 正規化
      const total = Object.values(adjustedWeights).reduce((sum, val) => sum + val, 0);
      
      return {
        popularity: adjustedWeights.popularity / total,
        jockey: adjustedWeights.jockey / total,
        odds: adjustedWeights.odds / total,
        base: adjustedWeights.base / total
      };
    } catch (error) {
      console.error('条件別重み計算エラー:', error);
      return this.getConditionPresetWeights(raceConditions);
    }
  }

  // 条件別プリセット重み
  private getConditionPresetWeights(conditions: { surface: string; distance: number; course: string }) {
    // 芝レース
    if (conditions.surface === '芝') {
      if (conditions.distance <= 1400) {
        // 芝短距離: スピード重視（人気・騎手重要）
        return { popularity: 0.45, jockey: 0.35, odds: 0.15, base: 0.05 };
      } else if (conditions.distance >= 2400) {
        // 芝長距離: スタミナ・騎手技術重視
        return { popularity: 0.3, jockey: 0.45, odds: 0.2, base: 0.05 };
      } else {
        // 芝中距離: バランス型
        return { popularity: 0.4, jockey: 0.35, odds: 0.2, base: 0.05 };
      }
    }
    
    // ダートレース
    else if (conditions.surface === 'ダート') {
      if (conditions.distance <= 1400) {
        // ダート短距離: パワー・人気重視
        return { popularity: 0.5, jockey: 0.3, odds: 0.15, base: 0.05 };
      } else {
        // ダート中長距離: 騎手・持続力重視
        return { popularity: 0.35, jockey: 0.4, odds: 0.2, base: 0.05 };
      }
    }
    
    // デフォルト
    return { popularity: 0.4, jockey: 0.3, odds: 0.2, base: 0.1 };
  }

  // 条件別補正の適用
  private applyConditionAdjustments(
    baseWeights: { popularity: number; jockey: number; odds: number; base: number },
    conditions: { surface: string; distance: number; course: string }
  ) {
    let adjustedWeights = { ...baseWeights };

    // 芝レースでの補正
    if (conditions.surface === '芝') {
      // 長距離では騎手の重要度を上げる
      if (conditions.distance >= 2400) {
        adjustedWeights.jockey *= 1.2;
        adjustedWeights.popularity *= 0.9;
      }
      // 短距離では人気の重要度を上げる
      else if (conditions.distance <= 1400) {
        adjustedWeights.popularity *= 1.1;
        adjustedWeights.odds *= 0.9;
      }
    }

    // ダートレースでの補正
    else if (conditions.surface === 'ダート') {
      // ダートでは人気がより重要
      adjustedWeights.popularity *= 1.15;
      adjustedWeights.jockey *= 1.05;
      adjustedWeights.odds *= 0.95;
    }

    // 重賞コースでの補正（東京・阪神・京都・中山）
    const majorCourses = ['東京', '阪神', '京都', '中山'];
    if (majorCourses.includes(conditions.course)) {
      // 重賞コースでは騎手の技術がより重要
      adjustedWeights.jockey *= 1.1;
    }

    return adjustedWeights;
  }

  // 期間情報の分析
  private analyzePeriodInfo(races: Race[]) {
    if (races.length === 0) {
      return { dateRange: '期間不明', totalRaces: 0 };
    }

    const dates = races.map(race => race.date).sort();
    const earliestDate = dates[0];
    const latestDate = dates[dates.length - 1];
    
    // 期間の長さを計算
    const startDate = new Date(earliestDate);
    const endDate = new Date(latestDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsDiff = Math.floor(daysDiff / 30);
    
    let periodDescription = '';
    if (monthsDiff < 1) {
      periodDescription = `約${daysDiff}日間`;
    } else if (monthsDiff < 12) {
      periodDescription = `約${monthsDiff}ヶ月間`;
    } else {
      const yearsDiff = Math.floor(monthsDiff / 12);
      const remainingMonths = monthsDiff % 12;
      periodDescription = remainingMonths > 0 
        ? `約${yearsDiff}年${remainingMonths}ヶ月間`
        : `約${yearsDiff}年間`;
    }

    return {
      dateRange: `${earliestDate} - ${latestDate} (${periodDescription})`,
      totalRaces: races.length,
      earliestDate,
      latestDate,
      periodDescription
    };
  }

  // 季節データの分析
  private analyzeSeasonalData(similarRaces: Race[], raceConditions: { surface: string; distance: number; course: string }) {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentSeason = this.getSeasonFromMonth(currentMonth);
    
    // 季節別に分類
    const seasonalBreakdown = {
      spring: 0,  // 3-5月
      summer: 0,  // 6-8月
      autumn: 0,  // 9-11月  
      winter: 0   // 12-2月
    };

    similarRaces.forEach(race => {
      const raceMonth = new Date(race.date).getMonth() + 1;
      const season = this.getSeasonFromMonth(raceMonth);
      seasonalBreakdown[season]++;
    });

    // 現在の季節のデータ数
    const currentSeasonData = seasonalBreakdown[currentSeason];
    const currentSeasonName = this.getSeasonName(currentSeason);
    
    // 季節の偏りを分析
    const maxSeasonData = Math.max(...Object.values(seasonalBreakdown));
    const hasSeasonalBias = maxSeasonData > similarRaces.length * 0.6;

    let seasonNote = '';
    let detailLog = '';

    if (similarRaces.length === 0) {
      seasonNote = '(データなし)';
    } else {
      seasonNote = `(現在${currentSeasonName}・同季節${currentSeasonData}件)`;
      
      // 詳細ログ
      detailLog = `📊 季節別内訳: 春${seasonalBreakdown.spring}件 / 夏${seasonalBreakdown.summer}件 / 秋${seasonalBreakdown.autumn}件 / 冬${seasonalBreakdown.winter}件`;
      
      if (hasSeasonalBias) {
        const dominantSeason = Object.entries(seasonalBreakdown)
          .reduce((max, [season, count]) => count > max.count ? { season, count } : max, { season: '', count: 0 });
        detailLog += `\n🎯 ${this.getSeasonName(dominantSeason.season as any)}データが多め (${dominantSeason.count}/${similarRaces.length}件)`;
      }

      if (currentSeasonData < 3 && similarRaces.length >= 5) {
        detailLog += `\n⚠️ 現在の季節(${currentSeasonName})のデータが少なめです`;
      }

      // 夏競馬の特別注記
      if (currentSeason === 'summer' && seasonalBreakdown.summer > 0) {
        detailLog += `\n🌞 夏競馬期間: 騎手技術がより重要になる傾向`;
      }
    }

    return {
      seasonNote,
      detailLog,
      currentSeason,
      currentSeasonData,
      seasonalBreakdown,
      hasSeasonalBias
    };
  }

  // 月から季節を判定
  private getSeasonFromMonth(month: number): 'spring' | 'summer' | 'autumn' | 'winter' {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter'; // 12, 1, 2月
  }

  // 季節名を取得
  private getSeasonName(season: 'spring' | 'summer' | 'autumn' | 'winter'): string {
    const seasonNames = {
      spring: '春',
      summer: '夏', 
      autumn: '秋',
      winter: '冬'
    };
    return seasonNames[season];
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

  // 騎手名から記号を除去する関数
  private cleanJockeyName(jockeyName: string): string {
    return jockeyName.replace(/[▲★☆◇]/g, '').trim();
  }

  // 騎手別統計計算
  private calculateJockeyStats(races: Race[], filters: any = {}) {
    const filteredRaces = this.filterRaces(races, filters);
    const stats: any = {};

    filteredRaces.forEach(race => {
      if (!race.result) return;

      race.horses.forEach(horse => {
        const originalJockey = horse.jockey;
        if (!originalJockey) return;

        // 騎手名から記号を除去
        const cleanJockey = this.cleanJockeyName(originalJockey);

        if (!stats[cleanJockey]) {
          stats[cleanJockey] = {
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

        stats[cleanJockey].total++;
        stats[cleanJockey].totalField += race.horses.length;

        if (race.result?.["1着"] === horse.name) stats[cleanJockey].wins++;
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name) {
          stats[cleanJockey].places++;
        }
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name || race.result?.["3着"] === horse.name) {
          stats[cleanJockey].shows++;
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

  // 馬番別統計計算
  private calculateHorseNumberStats(races: Race[], filters: any = {}) {
    const filteredRaces = this.filterRaces(races, filters);
    const stats: any = {};

    filteredRaces.forEach(race => {
      if (!race.result) return;

      race.horses.forEach(horse => {
        const horseNumber = horse.horseNumber;
        if (!horseNumber || horseNumber < 1 || horseNumber > 18) return; // 1-18番の範囲内のみ

        if (!stats[horseNumber]) {
          stats[horseNumber] = {
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

        stats[horseNumber].total++;
        stats[horseNumber].totalField += race.horses.length;

        if (race.result?.["1着"] === horse.name) stats[horseNumber].wins++;
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name) {
          stats[horseNumber].places++;
        }
        if (race.result?.["1着"] === horse.name || race.result?.["2着"] === horse.name || race.result?.["3着"] === horse.name) {
          stats[horseNumber].shows++;
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
        odds: 0.2,
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

        // 騎手統計による予測（記号を除去した名前で検索）
        const cleanJockeyName = this.cleanJockeyName(horse.jockey);
        const jockeyData = jockeyStats[cleanJockeyName];
        if (jockeyData) {
          const jockeyScore = parseFloat(jockeyData.winRate) / 100;
          score += weights.jockey * jockeyScore;
        }

        // オッズによる調整
        const oddsScore = Math.max(0, (1 - Math.log(horse.odds) / Math.log(20)));
        score += weights.odds * oddsScore;

        // 正規化
        const normalizedScore = Math.min(1, Math.max(0, score));
        
        return {
          horse,
          predictedWinRate: normalizedScore,
          confidence: 0.6 + (normalizedScore * 0.3),
          factors: {
            popularity: { rate: popularityScore, weight: weights.popularity },
            jockey: { rate: jockeyData ? parseFloat(jockeyData.winRate) / 100 : 0, weight: weights.jockey },
            distance: { rate: oddsScore, weight: weights.odds }
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

  // 人気精度計算
  private calculatePopularityAccuracy(races: Race[]): number {
    const racesWithResults = races.filter(race => race.result);
    if (racesWithResults.length === 0) return 0.3; // デフォルト値

    let totalHorses = 0;
    let popularityWins = 0;

    racesWithResults.forEach(race => {
      race.horses.forEach(horse => {
        totalHorses++;
        if (race.result?.["1着"] === horse.name) {
          // 人気順位が高いほど高スコア
          const popularityScore = Math.max(0, (race.horses.length - horse.popularity + 1) / race.horses.length);
          popularityWins += popularityScore;
        }
      });
    });

    return totalHorses > 0 ? popularityWins / totalHorses : 0.3;
  }

  // 騎手精度計算
  private calculateJockeyAccuracy(races: Race[]): number {
    const racesWithResults = races.filter(race => race.result);
    if (racesWithResults.length === 0) return 0.2; // デフォルト値

    const jockeyStats: { [key: string]: { wins: number; total: number } } = {};

    racesWithResults.forEach(race => {
      race.horses.forEach(horse => {
        const cleanJockeyName = this.cleanJockeyName(horse.jockey);
        if (!jockeyStats[cleanJockeyName]) {
          jockeyStats[cleanJockeyName] = { wins: 0, total: 0 };
        }
        jockeyStats[cleanJockeyName].total++;
        if (race.result?.["1着"] === horse.name) {
          jockeyStats[cleanJockeyName].wins++;
        }
      });
    });

    // 騎手別勝率の分散を計算（データの有効性指標）
    const jockeyWinRates = Object.values(jockeyStats)
      .filter(stat => stat.total >= 2) // 最低2回以上騎乗
      .map(stat => stat.wins / stat.total);

    if (jockeyWinRates.length === 0) return 0.2;

    const avgWinRate = jockeyWinRates.reduce((sum, rate) => sum + rate, 0) / jockeyWinRates.length;
    return Math.min(0.5, avgWinRate * 2); // 最大50%
  }

  // オッズ精度計算（オッズの的中精度を計算）
  private calculateOddsAccuracy(races: Race[]): number {
    const racesWithResults = races.filter(race => race.result);
    if (racesWithResults.length === 0) return 0.15; // デフォルト値

    let totalScore = 0;
    let totalChecks = 0;

    racesWithResults.forEach(race => {
      race.horses.forEach(horse => {
        totalChecks++;
        if (race.result?.["1着"] === horse.name) {
          // オッズが低い（期待値高い）ほど高スコア
          const oddsScore = Math.max(0, Math.min(1, (10 - horse.odds) / 10));
          totalScore += oddsScore;
        }
      });
    });

    return totalChecks > 0 ? (totalScore / totalChecks) * 0.4 : 0.15; // 最大40%
  }
}

export const localStorageApi = new LocalStorageApi();

// 初期化
if (typeof window !== 'undefined') {
  localStorageApi.initialize();
}