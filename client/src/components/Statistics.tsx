import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PopularityStats, StatsData } from '../types';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const sortedPopularities = Object.keys(stats).sort((a, b) => parseInt(a) - parseInt(b));

  const getTotalRaces = () => {
    return Object.values(stats).reduce((sum, stat) => sum + stat.wins, 0);
  };

  const getOverallStats = () => {
    const totalRuns = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
    const totalWins = Object.values(stats).reduce((sum, stat) => sum + stat.wins, 0);
    const totalPlaces = Object.values(stats).reduce((sum, stat) => sum + stat.places, 0);
    const totalShows = Object.values(stats).reduce((sum, stat) => sum + stat.shows, 0);
    
    return {
      totalRuns,
      totalWins,
      totalPlaces,
      totalShows,
      overallWinRate: totalRuns > 0 ? (totalWins / totalRuns * 100).toFixed(1) : "0.0",
      overallPlaceRate: totalRuns > 0 ? (totalPlaces / totalRuns * 100).toFixed(1) : "0.0",
      overallShowRate: totalRuns > 0 ? (totalShows / totalRuns * 100).toFixed(1) : "0.0"
    };
  };

  const overallStats = getOverallStats();

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>人気別統計</h2>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={fetchStats} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? '更新中...' : '統計を更新'}
        </button>
      </div>
      
      {sortedPopularities.length > 0 ? (
        <>
          {/* 全体統計サマリー */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>全体統計サマリー</h3>
            <p>
              <strong>総レース数:</strong> {getTotalRaces()}レース | 
              <strong> 総出走数:</strong> {overallStats.totalRuns}回 | 
              <strong> 全体勝率:</strong> {overallStats.overallWinRate}% | 
              <strong> 全体連対率:</strong> {overallStats.overallPlaceRate}% | 
              <strong> 全体複勝率:</strong> {overallStats.overallShowRate}%
            </p>
          </div>

          {/* 人気別詳細統計 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef' }}>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>人気</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>出走数</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>1着</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>勝率</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>連対率</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>複勝率</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>期待値</th>
              </tr>
            </thead>
            <tbody>
              {sortedPopularities.map(popularity => {
                const stat = stats[popularity];
                const winRateNum = parseFloat(stat.winRate);
                const expectedValue = winRateNum > 0 ? `約${(100/winRateNum).toFixed(1)}倍` : '---';
                
                return (
                  <tr key={popularity} style={{ backgroundColor: winRateNum > 20 ? '#d4edda' : 'white' }}>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                      {popularity}番人気
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                      {stat.total}回
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                      {stat.wins}回
                    </td>
                    <td style={{ 
                      border: '1px solid #ddd', 
                      padding: '10px', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: winRateNum > 15 ? '#155724' : winRateNum > 5 ? '#856404' : '#721c24'
                    }}>
                      {stat.winRate}%
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                      {stat.placeRate}%
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                      {stat.showRate}%
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                      {expectedValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <p>
              <strong>見方:</strong> 
              緑背景は勝率20%超の人気、期待値は単勝的中時に必要な最低オッズの目安です。
              <br />
              例: 1番人気の勝率が30%なら、3.3倍以上のオッズがあれば期待値プラス
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            統計データがありません。<br />
            レース結果を登録すると人気別の勝率統計が表示されます。
          </p>
        </div>
      )}
    </div>
  );
};

export default Statistics;