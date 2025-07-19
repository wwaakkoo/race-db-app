import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface JockeyStats {
  total: number;
  wins: number;
  places: number;
  shows: number;
  winRate: string;
  placeRate: string;
  showRate: string;
}


const AdvancedStatistics: React.FC = () => {
  const [jockeyStats, setJockeyStats] = useState<{ [key: string]: JockeyStats }>({});
  const [loading, setLoading] = useState(false);
  
  // フィルタ状態
  const [filters, setFilters] = useState({
    course: '',
    surface: '',
    distance: '',
    level: ''
  });
  
  // フィルタ用の選択肢データ
  const [filterOptions, setFilterOptions] = useState({
    courses: [] as string[],
    surfaces: [] as string[],
    distances: [] as string[],
    levels: [] as string[]
  });

  const fetchJockeyStats = async (filterParams = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics/jockey', { params: filterParams });
      setJockeyStats(response.data);
    } catch (error) {
      console.error('騎手別統計取得エラー:', error);
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
    fetchJockeyStats();
  }, []);
  
  useEffect(() => {
    const filterParams = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    fetchJockeyStats(filterParams);
  }, [filters]);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ course: '', surface: '', distance: '', level: '' });
  };

  const renderFilters = () => (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
      <h4 style={{ marginTop: 0 }}>フィルタ条件</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>コース:</label>
          <select 
            value={filters.course} 
            onChange={(e) => handleFilterChange('course', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">すべて</option>
            {filterOptions.courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>馬場:</label>
          <select 
            value={filters.surface} 
            onChange={(e) => handleFilterChange('surface', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">すべて</option>
            {filterOptions.surfaces.map(surface => (
              <option key={surface} value={surface}>{surface}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>距離:</label>
          <select 
            value={filters.distance} 
            onChange={(e) => handleFilterChange('distance', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">すべて</option>
            {filterOptions.distances.map(distance => (
              <option key={distance} value={distance}>{distance}m</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>レベル:</label>
          <select 
            value={filters.level} 
            onChange={(e) => handleFilterChange('level', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="">すべて</option>
            {filterOptions.levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>
      <button 
        onClick={clearFilters}
        style={{ padding: '5px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
      >
        フィルタをクリア
      </button>
      {Object.values(filters).some(v => v !== '') && (
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>適用中:</strong> 
          {filters.course && `コース: ${filters.course} `}
          {filters.surface && `馬場: ${filters.surface} `}
          {filters.distance && `距離: ${filters.distance}m `}
          {filters.level && `レベル: ${filters.level} `}
        </div>
      )}
    </div>
  );

  const renderJockeyStats = () => {
    const sortedJockeys = Object.entries(jockeyStats)
      .filter(([_, stats]) => stats.total >= 3) // 3回以上騎乗した騎手のみ表示
      .sort(([_, a], [__, b]) => parseFloat(b.winRate) - parseFloat(a.winRate));

    return (
      <div>
        {renderFilters()}
        <h4>騎手別統計（3回以上騎乗）</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>騎手</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>騎乗数</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>1着</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>勝率</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>連対率</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>複勝率</th>
            </tr>
          </thead>
          <tbody>
            {sortedJockeys.map(([jockey, stats]) => {
              const winRateNum = parseFloat(stats.winRate);
              return (
                <tr key={jockey} style={{ backgroundColor: winRateNum > 20 ? '#d4edda' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>
                    {jockey}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.total}回
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.wins}回
                  </td>
                  <td style={{ 
                    border: '1px solid #ddd', 
                    padding: '10px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: winRateNum > 25 ? '#155724' : winRateNum > 15 ? '#856404' : '#721c24'
                  }}>
                    {stats.winRate}%
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.placeRate}%
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.showRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>見方:</strong> 緑背景は勝率20%超の騎手です。勝率順で表示しています。フィルタ条件に該当するレースのみで統計を計算しています。
        </div>
      </div>
    );
  };


  return (
    <div style={{ margin: '20px 0' }}>
      <h2>騎手別統計分析</h2>
      
      {/* コンテンツ領域 */}
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '5px', 
        padding: '20px',
        minHeight: '400px',
        backgroundColor: 'white'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>統計を計算中...</p>
          </div>
        ) : (
          renderJockeyStats()
        )}
      </div>
    </div>
  );
};

export default AdvancedStatistics;