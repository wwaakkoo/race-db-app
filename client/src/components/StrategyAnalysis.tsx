import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface JockeyStats {
  wins: number;
  runs: number;
  winRate: number;
}

interface AnalysisSummary {
  totalRaces: number;
  totalHorses: number;
  jockeyStats: { [key: string]: JockeyStats };
  popularityStats: { [key: string]: JockeyStats };
  distanceStats: { [key: string]: JockeyStats };
  topJockeys: Array<{ jockey: string; wins: number; runs: number; winRate: number }>;
}

interface Horse {
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

interface RacePrediction {
  predictions: Prediction[];
  topRecommendations: Prediction[];
  averageConfidence: number;
}

interface Strategy {
  type: string;
  target: string;
  reason: string;
  confidence: number;
  expectedValue: number | string;
}

interface StrategyResponse {
  raceAnalysis: RacePrediction;
  recommendedStrategies: Strategy[];
  riskLevel: 'low' | 'medium' | 'high';
}

const StrategyAnalysis: React.FC = () => {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [prediction, setPrediction] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [testRaceData] = useState({
    course: '函館',
    distance: 1800,
    surface: '芝',
    condition: '良',
    level: '未勝利',
    horses: [
      { frameNumber: 1, horseNumber: 1, name: 'テストホース1', sex: '牡', age: 3, weight: 55, jockey: '武豊', odds: 2.5, popularity: 1 },
      { frameNumber: 2, horseNumber: 2, name: 'テストホース2', sex: '牝', age: 3, weight: 54, jockey: '丹内', odds: 4.2, popularity: 2 },
      { frameNumber: 3, horseNumber: 3, name: 'テストホース3', sex: '牡', age: 4, weight: 56, jockey: 'キング', odds: 6.8, popularity: 3 }
    ]
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/analysis/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('分析概要取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:3001/api/analysis/strategy', testRaceData);
      setPrediction(response.data);
    } catch (error) {
      console.error('予測エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading && !summary) {
    return <div className="loading">分析データを読み込んでいます...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🎯 戦略分析</h2>
      
      {/* 分析概要 */}
      {summary && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>📊 データ概要</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>総レース数: <strong>{summary.totalRaces}</strong></div>
            <div>総出走馬数: <strong>{summary.totalHorses}</strong></div>
            <div>1番人気勝率: <strong>{(summary.popularityStats['1']?.winRate * 100 || 0).toFixed(1)}%</strong></div>
          </div>
          
          <h4>🏆 トップ騎手</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            {summary.topJockeys.slice(0, 5).map((jockey, index) => (
              <div key={index} style={{ backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                {jockey.jockey}: {(jockey.winRate * 100).toFixed(1)}% ({jockey.wins}/{jockey.runs})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* レース予測セクション */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>🔮 レース予測</h3>
        <p>テストレース条件: {testRaceData.course} {testRaceData.distance}m {testRaceData.surface}</p>
        
        <button 
          onClick={runPrediction}
          disabled={loading}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? '分析中...' : '予測実行'}
        </button>

        {prediction && (
          <div>
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

            {/* 予測結果 */}
            <h4>🎯 予測順位</h4>
            <div style={{ marginBottom: '20px' }}>
              {prediction.raceAnalysis.topRecommendations.map((pred, index) => (
                <div 
                  key={index}
                  style={{
                    backgroundColor: index === 0 ? '#fef3c7' : '#f3f4f6',
                    padding: '10px',
                    margin: '5px 0',
                    borderRadius: '6px',
                    border: index === 0 ? '2px solid #f59e0b' : '1px solid #d1d5db'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    {index + 1}位: {pred.horse.name} ({pred.horse.jockey})
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    予測勝率: {(pred.predictedWinRate * 100).toFixed(1)}% | 
                    信頼度: {(pred.confidence * 100).toFixed(0)}% | 
                    オッズ: {pred.horse.odds}倍
                  </div>
                </div>
              ))}
            </div>

            {/* 推奨戦略 */}
            <h4>💡 推奨戦略</h4>
            {prediction.recommendedStrategies.length > 0 ? (
              <div>
                {prediction.recommendedStrategies.map((strategy, index) => (
                  <div 
                    key={index}
                    style={{
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #10b981',
                      padding: '12px',
                      margin: '8px 0',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#059669' }}>
                      {strategy.type}: {strategy.target}
                    </div>
                    <div style={{ fontSize: '14px', margin: '4px 0' }}>
                      理由: {strategy.reason}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      信頼度: {(strategy.confidence * 100).toFixed(0)}% | 
                      期待値: {typeof strategy.expectedValue === 'number' ? 
                        strategy.expectedValue.toFixed(2) : strategy.expectedValue}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                現在の条件では明確な推奨戦略がありません
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyAnalysis;