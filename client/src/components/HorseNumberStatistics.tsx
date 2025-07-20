import React, { useState, useEffect } from 'react';
import { localStorageApi } from '../services/localStorageApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const HorseNumberStatistics: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string; direction: 'asc' | 'desc'} | null>(null);
  
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
      const statsData = await localStorageApi.getHorseNumberStatistics(filterParams);
      setStats(statsData);
    } catch (error) {
      console.error('馬番別統計取得エラー:', error);
    }
    setLoading(false);
  };
  
  const fetchFilterOptions = async () => {
    try {
      const races = await localStorageApi.getRaces();
      
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

  // 馬番データのフィルタリングと並び替え
  const getSortedHorseNumbers = () => {
    let horseNumbers = Object.keys(stats)
      .map(n => parseInt(n))
      .filter(n => n >= 1 && n <= 18) // 1～18番の範囲内
      .map(n => n.toString());

    // ソート設定がある場合はそれに従って並び替え
    if (sortConfig) {
      horseNumbers.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortConfig.key) {
          case 'horseNumber':
            aValue = parseInt(a);
            bValue = parseInt(b);
            break;
          case 'total':
            aValue = stats[a]?.total || 0;
            bValue = stats[b]?.total || 0;
            break;
          case 'wins':
            aValue = stats[a]?.wins || 0;
            bValue = stats[b]?.wins || 0;
            break;
          case 'winRate':
            aValue = parseFloat(stats[a]?.winRate || '0');
            bValue = parseFloat(stats[b]?.winRate || '0');
            break;
          case 'placeRate':
            aValue = parseFloat(stats[a]?.placeRate || '0');
            bValue = parseFloat(stats[b]?.placeRate || '0');
            break;
          case 'showRate':
            aValue = parseFloat(stats[a]?.showRate || '0');
            bValue = parseFloat(stats[b]?.showRate || '0');
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // デフォルトは馬番順（昇順）
      horseNumbers.sort((a, b) => parseInt(a) - parseInt(b));
    }
    
    return horseNumbers;
  };

  const sortedHorseNumbers = getSortedHorseNumbers();

  const getTotalRaces = () => {
    return Object.values(stats).reduce((sum, stat: any) => sum + stat.wins, 0);
  };

  const getOverallStats = () => {
    const totalRuns = Object.values(stats).reduce((sum, stat: any) => sum + stat.total, 0);
    const totalWins = Object.values(stats).reduce((sum, stat: any) => sum + stat.wins, 0);
    const totalPlaces = Object.values(stats).reduce((sum, stat: any) => sum + stat.places, 0);
    const totalShows = Object.values(stats).reduce((sum, stat: any) => sum + stat.shows, 0);
    
    return {
      totalRuns,
      totalWins,
      totalPlaces,
      totalShows,
      overallWinRate: (totalRuns as number) > 0 ? ((totalWins as number) / (totalRuns as number) * 100).toFixed(1) : "0.0",
      overallPlaceRate: (totalRuns as number) > 0 ? ((totalPlaces as number) / (totalRuns as number) * 100).toFixed(1) : "0.0",
      overallShowRate: (totalRuns as number) > 0 ? ((totalShows as number) / (totalRuns as number) * 100).toFixed(1) : "0.0"
    };
  };

  const overallStats = getOverallStats();

  // ソート処理関数
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ソートボタンのアイコン
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return ' ↕';
    }
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // グラフ用データ準備
  const prepareBarChartData = () => {
    const labels = sortedHorseNumbers.map(n => `${n}番`);
    const winRateData = sortedHorseNumbers.map(n => parseFloat(stats[n]?.winRate || '0'));
    const placeRateData = sortedHorseNumbers.map(n => parseFloat(stats[n]?.placeRate || '0'));
    const showRateData = sortedHorseNumbers.map(n => parseFloat(stats[n]?.showRate || '0'));

    return {
      labels,
      datasets: [
        {
          label: '勝率',
          data: winRateData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: '連対率',
          data: placeRateData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: '複勝率',
          data: showRateData,
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const preparePieChartData = () => {
    const winData = sortedHorseNumbers.slice(0, 8).map(n => stats[n]?.wins || 0);
    const labels = sortedHorseNumbers.slice(0, 8).map(n => `${n}番`);
    
    return {
      labels,
      datasets: [
        {
          label: '勝数',
          data: winData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '馬番別統計グラフ',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '馬番別勝数分布',
      },
    },
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
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        <button 
          onClick={() => setShowGraphs(!showGraphs)}
          style={{ padding: '5px 15px', backgroundColor: showGraphs ? '#28a745' : '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          {showGraphs ? 'テーブル表示' : 'グラフ表示'}
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
      <h2>馬番別統計</h2>
      {renderFilters()}
      
      {sortedHorseNumbers.length > 0 ? (
        <>
          {/* 全体統計サマリー */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>全体統計サマリー</h3>
            <div>
              {`総レース数: ${getTotalRaces()}レース | 総出走数: ${overallStats.totalRuns}回 | 全体勝率: ${overallStats.overallWinRate}% | 全体連対率: ${overallStats.overallPlaceRate}% | 全体複勝率: ${overallStats.overallShowRate}%`}
            </div>
          </div>

          {/* グラフ表示エリア */}
          {showGraphs && (
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* 棒グラフ */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <Bar data={prepareBarChartData()} options={chartOptions} />
                </div>
                
                {/* 円グラフ */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <Pie data={preparePieChartData()} options={pieChartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* 馬番別詳細統計テーブル */}
          {!showGraphs && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e9ecef' }}>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('horseNumber')}
                  title="クリックでソート"
                >
                  馬番{getSortIcon('horseNumber')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('total')}
                  title="クリックでソート"
                >
                  出走数{getSortIcon('total')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('wins')}
                  title="クリックでソート"
                >
                  1着{getSortIcon('wins')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('winRate')}
                  title="クリックでソート"
                >
                  勝率{getSortIcon('winRate')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('placeRate')}
                  title="クリックでソート"
                >
                  連対率{getSortIcon('placeRate')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('showRate')}
                  title="クリックでソート"
                >
                  複勝率{getSortIcon('showRate')}
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>期待値</th>
              </tr>
            </thead>
            <tbody>
              {sortedHorseNumbers.map(horseNumber => {
                const stat = stats[horseNumber];
                const winRateNum = parseFloat(stat.winRate);
                const expectedValue = winRateNum > 0 ? `約${(100/winRateNum).toFixed(1)}倍` : '---';
                
                return (
                  <tr key={horseNumber} style={{ backgroundColor: winRateNum > 15 ? '#d4edda' : 'white' }}>
                    <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                      {horseNumber}番
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
                      color: winRateNum > 15 ? '#155724' : winRateNum > 8 ? '#856404' : '#721c24'
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
          )}

          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            <p>
              <strong>見方:</strong> 
              {showGraphs ? 
                '棒グラフは馬番別の勝率・連対率・複勝率を比較表示。円グラフは馬番別勝数分布を表示。フィルタ条件で絞り込み可能。' :
                '緑背景は勝率15%超の馬番、期待値は単勝的中時に必要な最低オッズの目安です。複数選択したフィルタ条件のいずれかに該当するレースのみで統計を計算しています。'
              }
              <br />
              {!showGraphs && '馬番の有利・不利傾向を分析できます。内枠（1-8番）と外枠（9-18番）での成績差なども確認可能。'}
              <br />
              <small>※ 馬番データが1～18番の範囲外の場合は統計から除外されます</small>
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            統計データがありません。<br />
            レース結果を登録すると馬番別の勝率統計が表示されます。
          </p>
        </div>
      )}
    </div>
  );
};

export default HorseNumberStatistics;