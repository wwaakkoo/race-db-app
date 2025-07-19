import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { StatsData } from '../types';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(false);
  
  // フィルタ状態（複数選択対応）
  const [filters, setFilters] = useState({
    course: [] as string[],
    surface: [] as string[],
    distance: [] as string[],
    level: [] as string[]
  });
  
  // フィルタ用の選択肢データ
  const [filterOptions, setFilterOptions] = useState({
    courses: [] as string[],
    surfaces: [] as string[],
    distances: [] as string[],
    levels: [] as string[]
  });

  const fetchStats = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics', { params: filterParams });
      setStats(response.data);
    } catch (error) {
      console.error('統計取得エラー:', error);
    }
    setLoading(false);
  };
  
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get('/api/race');
      const races = response.data;
      
      const courses = Array.from(new Set(races.map((race: any) => race.course).filter(Boolean))) as string[];
      const surfaces = Array.from(new Set(races.map((race: any) => race.surface).filter(Boolean))) as string[];
      const distances = Array.from(new Set(races.map((race: any) => race.distance).filter(Boolean))).sort((a: any, b: any) => a - b) as string[];
      const levels = Array.from(new Set(races.map((race: any) => race.level).filter(Boolean))) as string[];
      
      setFilterOptions({ courses, surfaces, distances, levels });
    } catch (error) {
      console.error('フィルタ選択肢取得エラー:', error);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchStats();
  }, []);
  
  useEffect(() => {
    const filterParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => Array.isArray(value) && value.length > 0)
    );
    fetchStats(filterParams);
  }, [filters]);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[key as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)  // 選択解除
        : [...currentValues, value];  // 選択追加
      return { ...prev, [key]: newValues };
    });
  };
  
  const clearFilters = () => {
    setFilters({ course: [], surface: [], distance: [], level: [] });
  };

  // 人気データのフィルタリングと並び替え
  const sortedPopularities = Object.keys(stats)
    .map(p => parseInt(p))
    .filter(p => p >= 1 && p <= 18) // 1～18番人気に制限（通常の出走頭数範囲）
    .sort((a, b) => a - b)
    .map(p => p.toString());

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

  const renderFilters = () => (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
      <h4 style={{ marginTop: 0 }}>フィルタ条件</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>コース:</label>
          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
            {filterOptions.courses.map(course => (
              <label key={course} style={{ display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.course.includes(course)}
                  onChange={() => handleFilterChange('course', course)}
                  style={{ marginRight: '5px' }}
                />
                {course}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>馬場:</label>
          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
            {filterOptions.surfaces.map(surface => (
              <label key={surface} style={{ display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.surface.includes(surface)}
                  onChange={() => handleFilterChange('surface', surface)}
                  style={{ marginRight: '5px' }}
                />
                {surface}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>距離:</label>
          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
            {filterOptions.distances.map(distance => (
              <label key={distance} style={{ display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.distance.includes(distance)}
                  onChange={() => handleFilterChange('distance', distance)}
                  style={{ marginRight: '5px' }}
                />
                {distance}m
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>レベル:</label>
          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px', borderRadius: '3px' }}>
            {filterOptions.levels.map(level => (
              <label key={level} style={{ display: 'block', marginBottom: '2px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.level.includes(level)}
                  onChange={() => handleFilterChange('level', level)}
                  style={{ marginRight: '5px' }}
                />
                {level}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={clearFilters}
          style={{ padding: '5px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          フィルタをクリア
        </button>
        <button 
          onClick={() => fetchStats(Object.fromEntries(Object.entries(filters).filter(([_, value]) => Array.isArray(value) && value.length > 0)))}
          disabled={loading} 
          style={{ padding: '5px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          {loading ? '更新中...' : '統計を更新'}
        </button>
      </div>
      {Object.values(filters).some(v => Array.isArray(v) && v.length > 0) && (
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>適用中:</strong> 
          {filters.course.length > 0 && `コース: ${filters.course.join(', ')} `}
          {filters.surface.length > 0 && `馬場: ${filters.surface.join(', ')} `}
          {filters.distance.length > 0 && `距離: ${filters.distance.join(', ')}m `}
          {filters.level.length > 0 && `レベル: ${filters.level.join(', ')} `}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>人気別統計</h2>
      {renderFilters()}
      
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
              緑背景は勝率20%超の人気、期待値は単勝的中時に必要な最低オッズの目安です。複数選択したフィルタ条件のいずれかに該当するレースのみで統計を計算しています。
              <br />
              例: 1番人気の勝率が30%なら、3.3倍以上のオッズがあれば期待値プラス
              <br />
              <small>※ 人気データが1～18番人気の範囲外の場合は統計から除外されます</small>
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