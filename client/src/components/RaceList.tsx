import React, { useEffect, useState } from 'react';
import { localStorageApi, Race } from '../services/localStorageApi';
import ResultForm from './ResultForm';

const RaceList = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    course: '',
    level: ''
  });

  const fetchRaces = async () => {
    try {
      const raceList = await localStorageApi.getRaces();
      setRaces(raceList);
    } catch (err) {
      console.error('レース一覧の取得に失敗:', err);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const handleResultUpdated = () => {
    setEditingRaceId(null);
    fetchRaces();
  };

  const handleCancelEdit = () => {
    setEditingRaceId(null);
  };

  const handleDeleteRace = async (raceId: string, raceName: string) => {
    if (window.confirm(`「${raceName}」を削除しますか？この操作は元に戻せません。`)) {
      try {
        await localStorageApi.deleteRace(raceId);
        await fetchRaces(); // リスト更新
        alert('レースを削除しました');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const getHorseDisplayForResult = (race: Race, horseName?: string) => {
    if (!horseName) return '';
    const horse = race.horses.find(h => h.name === horseName);
    return horse ? `${horse.horseNumber}番 ${horseName}` : horseName;
  };

  // フィルタリング適用
  const filteredRaces = races.filter(race => {
    const dateMatch = !filters.date || race.date === filters.date;
    const courseMatch = !filters.course || race.course === filters.course;
    const levelMatch = !filters.level || race.level === filters.level;
    return dateMatch && courseMatch && levelMatch;
  });

  // 表示するレースを決定（最新12件 or 全件）
  const displayRaces = showAll ? filteredRaces : filteredRaces.slice(-12);
  const hasMoreRaces = filteredRaces.length > 12;

  // フィルタ用の選択肢を取得
  const uniqueDates = Array.from(new Set(races.map(race => race.date))).sort().reverse();
  const uniqueCourses = Array.from(new Set(races.map(race => race.course)));
  const uniqueLevels = Array.from(new Set(races.map(race => race.level)));

  return (
    <div>
      <h2>保存済みレース一覧</h2>
      
      {/* フィルタリングセクション */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        border: '1px solid #ddd'
      }}>
        <h4 style={{ marginTop: '0', marginBottom: '10px' }}>絞り込み</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: '5px' }}>開催日:</label>
            <select 
              value={filters.date} 
              onChange={(e) => setFilters({...filters, date: e.target.value})}
              style={{ padding: '4px 8px' }}
            >
              <option value="">全て</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ marginRight: '5px' }}>コース:</label>
            <select 
              value={filters.course} 
              onChange={(e) => setFilters({...filters, course: e.target.value})}
              style={{ padding: '4px 8px' }}
            >
              <option value="">全て</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ marginRight: '5px' }}>レベル:</label>
            <select 
              value={filters.level} 
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              style={{ padding: '4px 8px' }}
            >
              <option value="">全て</option>
              {uniqueLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => setFilters({date: '', course: '', level: ''})}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            リセット
          </button>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
          {filteredRaces.length}件のレースが見つかりました
        </div>
      </div>

      {hasMoreRaces && (
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={() => setShowAll(!showAll)}
            style={{ 
              padding: '6px 12px', 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showAll ? `最新12件のみ表示 (${filteredRaces.length}件中)` : `全件表示 (${filteredRaces.length}件)`}
          </button>
        </div>
      )}
      <div>
        {displayRaces.map((race) => (
          <div key={race.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
            <div>
              <strong>{race.course} {race.level}</strong> / {race.surface} {race.distance}m [{race.condition}]<br />
              開催日: {race.date} | 出走頭数: {race.horses.length}
            </div>
            
            {race.result ? (
              <div style={{ marginTop: '5px', color: '#666' }}>
                結果: 1着 {getHorseDisplayForResult(race, race.result["1着"])} / 
                2着 {getHorseDisplayForResult(race, race.result["2着"])} / 
                3着 {getHorseDisplayForResult(race, race.result["3着"])}
              </div>
            ) : (
              <div style={{ marginTop: '5px', color: '#999' }}>
                結果未登録
              </div>
            )}
            
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              {editingRaceId === race.id ? (
                <ResultForm 
                  race={race} 
                  onResultUpdated={handleResultUpdated}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <>
                  <button 
                    onClick={() => setEditingRaceId(race.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    {race.result ? '結果を編集' : '結果を登録'}
                  </button>
                  <button 
                    onClick={() => handleDeleteRace(race.id, `${race.course} ${race.level}`)}
                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaceList;
