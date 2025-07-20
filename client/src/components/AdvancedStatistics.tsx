import React, { useState, useEffect } from 'react';
import { localStorageApi } from '../services/localStorageApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Scatter, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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
  const [showGraphs, setShowGraphs] = useState(false);
  const [graphType, setGraphType] = useState<'bar' | 'scatter' | 'pie'>('bar');
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

  const fetchJockeyStats = async (filterParams = {}) => {
    setLoading(true);
    try {
      const statsData = await localStorageApi.getJockeyStatistics(filterParams);
      setJockeyStats(statsData);
    } catch (error) {
      console.error('騎手別統計取得エラー:', error);
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

  // グラフ用データ準備関数
  const prepareJockeyBarChart = () => {
    const sortedJockeys = Object.entries(jockeyStats)
      .filter(([_, stats]) => stats.total >= 3)
      .sort(([_, a], [__, b]) => parseFloat(b.winRate) - parseFloat(a.winRate))
      .slice(0, 10); // 上位10名

    const labels = sortedJockeys.map(([jockey, _]) => jockey);
    const winRateData = sortedJockeys.map(([_, stats]) => parseFloat(stats.winRate));
    const placeRateData = sortedJockeys.map(([_, stats]) => parseFloat(stats.placeRate));
    const showRateData = sortedJockeys.map(([_, stats]) => parseFloat(stats.showRate));

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

  const prepareJockeyScatterChart = () => {
    const jockeyData = Object.entries(jockeyStats)
      .filter(([_, stats]) => stats.total >= 3)
      .map(([jockey, stats]) => ({
        x: stats.total, // 出場回数
        y: parseFloat(stats.winRate), // 勝率
        label: jockey
      }));

    return {
      datasets: [
        {
          label: '騎手別 出場回数 vs 勝率',
          data: jockeyData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          pointRadius: 8,
          pointHoverRadius: 10,
        },
      ],
    };
  };

  const prepareJockeyPieChart = () => {
    const topJockeys = Object.entries(jockeyStats)
      .filter(([_, stats]) => stats.total >= 3)
      .sort(([_, a], [__, b]) => b.wins - a.wins)
      .slice(0, 6); // 上位6名

    const labels = topJockeys.map(([jockey, _]) => jockey);
    const winData = topJockeys.map(([_, stats]) => stats.wins);

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
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '騎手別成績比較（上位10名）',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const scatterChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '騎手別 出場回数 vs 勝率',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = context.raw;
            return `${point.label}: 出場${point.x}回, 勝率${point.y}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '出場回数'
        }
      },
      y: {
        title: {
          display: true,
          text: '勝率(%)'
        },
        beginAtZero: true,
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
        text: '勝数上位騎手の分布',
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
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
        <button 
          onClick={clearFilters}
          style={{ padding: '5px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          フィルタをクリア
        </button>
        <button 
          onClick={() => setShowGraphs(!showGraphs)}
          style={{ padding: '5px 15px', backgroundColor: showGraphs ? '#28a745' : '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
        >
          {showGraphs ? 'テーブル表示' : 'グラフ表示'}
        </button>
        {showGraphs && (
          <>
            <button 
              onClick={() => setGraphType('bar')}
              style={{ padding: '5px 15px', backgroundColor: graphType === 'bar' ? '#007bff' : '#e9ecef', color: graphType === 'bar' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}
            >
              成績比較
            </button>
            <button 
              onClick={() => setGraphType('scatter')}
              style={{ padding: '5px 15px', backgroundColor: graphType === 'scatter' ? '#007bff' : '#e9ecef', color: graphType === 'scatter' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}
            >
              出場×勝率
            </button>
            <button 
              onClick={() => setGraphType('pie')}
              style={{ padding: '5px 15px', backgroundColor: graphType === 'pie' ? '#007bff' : '#e9ecef', color: graphType === 'pie' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}
            >
              勝数分布
            </button>
          </>
        )}
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

  const renderJockeyStats = () => {
    let sortedJockeys = Object.entries(jockeyStats)
      .filter(([_, stats]) => stats.total >= 3); // 3回以上騎乗した騎手のみ表示

    // ソート設定がある場合はそれに従って並び替え
    if (sortConfig) {
      sortedJockeys.sort(([jockeyA, statsA], [jockeyB, statsB]) => {
        let aValue: any, bValue: any;
        
        switch (sortConfig.key) {
          case 'jockey':
            aValue = jockeyA;
            bValue = jockeyB;
            break;
          case 'total':
            aValue = statsA.total;
            bValue = statsB.total;
            break;
          case 'wins':
            aValue = statsA.wins;
            bValue = statsB.wins;
            break;
          case 'winRate':
            aValue = parseFloat(statsA.winRate);
            bValue = parseFloat(statsB.winRate);
            break;
          case 'placeRate':
            aValue = parseFloat(statsA.placeRate);
            bValue = parseFloat(statsB.placeRate);
            break;
          case 'showRate':
            aValue = parseFloat(statsA.showRate);
            bValue = parseFloat(statsB.showRate);
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
      // デフォルトは勝率順（降順）
      sortedJockeys.sort(([_, a], [__, b]) => parseFloat(b.winRate) - parseFloat(a.winRate));
    }

    return (
      <div>
        {renderFilters()}
        <h4>騎手別統計（3回以上騎乗）</h4>
        
        {/* グラフ表示エリア */}
        {showGraphs && (
          <div style={{ marginBottom: '30px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
            {graphType === 'bar' && <Bar data={prepareJockeyBarChart()} options={barChartOptions} />}
            {graphType === 'scatter' && <Scatter data={prepareJockeyScatterChart()} options={scatterChartOptions} />}
            {graphType === 'pie' && <Pie data={prepareJockeyPieChart()} options={pieChartOptions} />}
          </div>
        )}
        
        {/* テーブル表示エリア */}
        {!showGraphs && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th 
                style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('jockey')}
                title="クリックでソート"
              >
                騎手{getSortIcon('jockey')}
              </th>
              <th 
                style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('total')}
                title="クリックでソート"
              >
                騎乗数{getSortIcon('total')}
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
        )}
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>見方:</strong> 
          {showGraphs ? 
            `${graphType === 'bar' ? '成績比較: 上位10名の勝率・連対率・複勝率を表示' : 
              graphType === 'scatter' ? '出場×勝率: 出場回数と勝率の関係を表示' : 
              '勝数分布: 上位6名の勝数分布を表示'}。フィルタ条件で絞り込み可能。` :
            '緑背景は勝率20%超の騎手です。勝率順で表示しています。複数選択したフィルタ条件のいずれかに該当するレースのみで統計を計算しています。'
          }
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