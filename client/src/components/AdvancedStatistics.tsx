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
      Object.entries(filters).filter(([_, value]) => Array.isArray(value) && value.length > 0)
    );
    fetchJockeyStats(filterParams);
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
      <button 
        onClick={clearFilters}
        style={{ padding: '5px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
      >
        フィルタをクリア
      </button>
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
          <strong>見方:</strong> 緑背景は勝率20%超の騎手です。勝率順で表示しています。複数選択したフィルタ条件のいずれかに該当するレースのみで統計を計算しています。
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