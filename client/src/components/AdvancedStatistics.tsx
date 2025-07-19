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

interface CourseStats {
  totalRaces: number;
  avgField: number;
  surfaces: { [key: string]: number };
  distances: { [key: string]: number };
  levels: { [key: string]: number };
}

interface DistanceStats {
  surface: string;
  distance: number;
  totalRaces: number;
  avgField: number;
  courses: { [key: string]: number };
}

const AdvancedStatistics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jockey' | 'course' | 'distance'>('jockey');
  const [jockeyStats, setJockeyStats] = useState<{ [key: string]: JockeyStats }>({});
  const [courseStats, setCourseStats] = useState<{ [key: string]: CourseStats }>({});
  const [distanceStats, setDistanceStats] = useState<{ [key: string]: DistanceStats }>({});
  const [loading, setLoading] = useState(false);

  const fetchJockeyStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics/jockey');
      setJockeyStats(response.data);
    } catch (error) {
      console.error('騎手別統計取得エラー:', error);
    }
    setLoading(false);
  };

  const fetchCourseStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics/course');
      setCourseStats(response.data);
    } catch (error) {
      console.error('コース別統計取得エラー:', error);
    }
    setLoading(false);
  };

  const fetchDistanceStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics/distance');
      setDistanceStats(response.data);
    } catch (error) {
      console.error('距離別統計取得エラー:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'jockey') {
      fetchJockeyStats();
    } else if (activeTab === 'course') {
      fetchCourseStats();
    } else if (activeTab === 'distance') {
      fetchDistanceStats();
    }
  }, [activeTab]);

  const renderJockeyStats = () => {
    const sortedJockeys = Object.entries(jockeyStats)
      .filter(([_, stats]) => stats.total >= 3) // 3回以上騎乗した騎手のみ表示
      .sort(([_, a], [__, b]) => parseFloat(b.winRate) - parseFloat(a.winRate));

    return (
      <div>
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
          <strong>見方:</strong> 緑背景は勝率20%超の騎手です。勝率順で表示しています。
        </div>
      </div>
    );
  };

  const renderCourseStats = () => {
    const sortedCourses = Object.entries(courseStats)
      .sort(([_, a], [__, b]) => b.totalRaces - a.totalRaces);

    return (
      <div>
        <h4>コース別統計</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>コース</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>開催数</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>平均出走頭数</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>主な馬場</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>主な距離</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>主なレベル</th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map(([course, stats]) => {
              const topSurface = Object.entries(stats.surfaces).sort(([,a], [,b]) => b - a)[0];
              const topDistance = Object.entries(stats.distances).sort(([,a], [,b]) => b - a)[0];
              const topLevel = Object.entries(stats.levels).sort(([,a], [,b]) => b - a)[0];
              
              return (
                <tr key={course}>
                  <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>
                    {course}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.totalRaces}レース
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.avgField}頭
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {topSurface ? `${topSurface[0]} (${topSurface[1]}回)` : '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {topDistance ? `${topDistance[0]}m (${topDistance[1]}回)` : '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {topLevel ? `${topLevel[0]} (${topLevel[1]}回)` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>見方:</strong> 開催数順で表示。主な項目は最多開催の条件を表示しています。
        </div>
      </div>
    );
  };

  const renderDistanceStats = () => {
    const sortedDistances = Object.entries(distanceStats)
      .sort(([_, a], [__, b]) => b.totalRaces - a.totalRaces);

    return (
      <div>
        <h4>距離別統計</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>馬場・距離</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>開催数</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>平均出走頭数</th>
              <th style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold' }}>主な開催場</th>
            </tr>
          </thead>
          <tbody>
            {sortedDistances.map(([key, stats]) => {
              const topCourse = Object.entries(stats.courses).sort(([,a], [,b]) => b - a)[0];
              
              return (
                <tr key={key}>
                  <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold' }}>
                    {stats.surface} {stats.distance}m
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.totalRaces}レース
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {stats.avgField}頭
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {topCourse ? `${topCourse[0]} (${topCourse[1]}回)` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          <strong>見方:</strong> 開催数順で表示。馬場と距離の組み合わせ別の統計です。
        </div>
      </div>
    );
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>高度な統計分析</h2>
      
      {/* タブナビゲーション */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('jockey')}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: activeTab === 'jockey' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'jockey' ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'jockey' ? 'bold' : 'normal'
          }}
        >
          騎手別統計
        </button>
        <button 
          onClick={() => setActiveTab('course')}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: activeTab === 'course' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'course' ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'course' ? 'bold' : 'normal'
          }}
        >
          コース別統計
        </button>
        <button 
          onClick={() => setActiveTab('distance')}
          style={{ 
            padding: '10px 20px',
            backgroundColor: activeTab === 'distance' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'distance' ? 'white' : 'black',
            border: '1px solid #ccc',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'distance' ? 'bold' : 'normal'
          }}
        >
          距離別統計
        </button>
      </div>

      {/* コンテンツ領域 */}
      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '0 5px 5px 5px', 
        padding: '20px',
        minHeight: '400px',
        backgroundColor: 'white'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>統計を計算中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'jockey' && renderJockeyStats()}
            {activeTab === 'course' && renderCourseStats()}
            {activeTab === 'distance' && renderDistanceStats()}
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedStatistics;