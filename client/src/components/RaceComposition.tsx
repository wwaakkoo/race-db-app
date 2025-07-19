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
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Race {
  id: string;
  date: string;
  course: string;
  distance: number;
  surface: string;
  condition: string;
  level: string;
  horses: any[];
}

const RaceComposition: React.FC = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const raceData = await localStorageApi.getRaces();
      setRaces(raceData);
    } catch (error) {
      console.error('レースデータ取得エラー:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  // コース別分布データ
  const prepareCourseData = () => {
    const courseCount: { [key: string]: number } = {};
    races.forEach(race => {
      courseCount[race.course] = (courseCount[race.course] || 0) + 1;
    });

    const labels = Object.keys(courseCount);
    const data = Object.values(courseCount);

    return {
      labels,
      datasets: [
        {
          label: 'レース数',
          data,
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

  // 距離別分布データ
  const prepareDistanceData = () => {
    const distanceCount: { [key: string]: number } = {};
    races.forEach(race => {
      const distance = `${race.distance}m`;
      distanceCount[distance] = (distanceCount[distance] || 0) + 1;
    });

    const sortedEntries = Object.entries(distanceCount).sort(([a], [b]) => 
      parseInt(a.replace('m', '')) - parseInt(b.replace('m', ''))
    );

    const labels = sortedEntries.map(([distance]) => distance);
    const data = sortedEntries.map(([, count]) => count);

    return {
      labels,
      datasets: [
        {
          label: 'レース数',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // 馬場別分布データ
  const prepareSurfaceData = () => {
    const surfaceCount: { [key: string]: number } = {};
    races.forEach(race => {
      surfaceCount[race.surface] = (surfaceCount[race.surface] || 0) + 1;
    });

    const labels = Object.keys(surfaceCount);
    const data = Object.values(surfaceCount);

    return {
      labels,
      datasets: [
        {
          label: 'レース数',
          data,
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // レベル別分布データ
  const prepareLevelData = () => {
    const levelCount: { [key: string]: number } = {};
    races.forEach(race => {
      levelCount[race.level] = (levelCount[race.level] || 0) + 1;
    });

    const labels = Object.keys(levelCount);
    const data = Object.values(levelCount);

    return {
      labels,
      datasets: [
        {
          label: 'レース数',
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // 統計サマリー計算
  const getStats = () => {
    const totalRaces = races.length;
    const totalHorses = races.reduce((sum, race) => sum + race.horses.length, 0);
    const avgHorsesPerRace = totalRaces > 0 ? (totalHorses / totalRaces).toFixed(1) : '0';
    
    const uniqueCourses = new Set(races.map(race => race.course)).size;
    const uniqueDistances = new Set(races.map(race => race.distance)).size;
    
    return {
      totalRaces,
      totalHorses,
      avgHorsesPerRace,
      uniqueCourses,
      uniqueDistances
    };
  };

  const stats = getStats();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>レース構成分析</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>データを読み込み中...</p>
        </div>
      ) : (
        <>
          {/* 統計サマリー */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>データ概要</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>{stats.totalRaces}</div>
                <div>総レース数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>{stats.totalHorses}</div>
                <div>総出走頭数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#17a2b8' }}>{stats.avgHorsesPerRace}</div>
                <div>平均出走頭数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ffc107' }}>{stats.uniqueCourses}</div>
                <div>開催コース数</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6f42c1' }}>{stats.uniqueDistances}</div>
                <div>距離設定数</div>
              </div>
            </div>
          </div>

          {/* グラフエリア */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* コース別分布 */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>コース別レース数分布</h4>
              <Pie data={prepareCourseData()} options={pieChartOptions} />
            </div>
            
            {/* 馬場別分布 */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>馬場別レース数分布</h4>
              <Doughnut data={prepareSurfaceData()} options={pieChartOptions} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* 距離別分布 */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>距離別レース数分布</h4>
              <Bar data={prepareDistanceData()} options={chartOptions} />
            </div>
            
            {/* レベル別分布 */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>レベル別レース数分布</h4>
              <Bar data={prepareLevelData()} options={chartOptions} />
            </div>
          </div>

          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
            <p>
              <strong>このページについて:</strong> 
              登録されているレースデータの構成を可視化しています。データの偏りや傾向を把握するのに役立ちます。
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default RaceComposition;