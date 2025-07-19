// client/src/types.ts
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
    resultRank?: number;
  }
  
  export interface RaceResult {
    "1着"?: string;
    "2着"?: string;
    "3着"?: string;
  }
  
  export interface Race {
    id: string;
    date: string;
    course: string;
    distance: number;
    surface: string;
    condition: string;
    level?: string;
    horses: Horse[];
    result?: RaceResult;
  }

  export interface PopularityStats {
    total: number;
    wins: number;
    places: number;
    shows: number;
    winRate: string;
    placeRate: string;
    showRate: string;
  }

  export interface StatsData {
    [popularity: string]: PopularityStats;
  }
  