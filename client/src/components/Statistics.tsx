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

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>人気別統計</h2>
      <button onClick={fetchStats} disabled={loading}>
        {loading ? '更新中...' : '統計を更新'}
      </button>
      
      {sortedPopularities.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>人気</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>出走数</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>勝利数</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>勝率(%)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>連対率(%)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>複勝率(%)</th>
            </tr>
          </thead>
          <tbody>
            {sortedPopularities.map(popularity => {
              const stat = stats[popularity];
              return (
                <tr key={popularity}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {popularity}番人気
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {stat.total}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {stat.wins}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {stat.winRate}%
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {stat.placeRate}%
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {stat.showRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>統計データがありません。レース結果を登録してください。</p>
      )}
    </div>
  );
};

export default Statistics;