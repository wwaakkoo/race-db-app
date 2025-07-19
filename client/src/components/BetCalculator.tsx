import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Race } from '../types';

interface BetRecord {
  raceId: string;
  raceName: string;
  betType: 'win' | 'place' | 'show';
  horseNames: string[];
  betAmount: number;
  payout: number;
  profit: number;
}

interface BetSummary {
  totalBets: number;
  totalPayout: number;
  totalProfit: number;
  winRate: number;
  records: BetRecord[];
}

const BetCalculator: React.FC = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [betType, setBetType] = useState<'win' | 'place' | 'show'>('win');
  const [selectedHorses, setSelectedHorses] = useState<string[]>([]);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betSummary, setBetSummary] = useState<BetSummary | null>(null);

  useEffect(() => {
    fetchRaces();
    fetchBetSummary();
  }, []);

  const fetchRaces = async () => {
    try {
      const response = await axios.get('/api/race');
      setRaces(response.data.filter((race: Race) => race.result));
    } catch (error) {
      console.error('レース取得エラー:', error);
    }
  };

  const fetchBetSummary = async () => {
    try {
      const response = await axios.get('/api/bets/summary');
      setBetSummary(response.data);
    } catch (error) {
      console.error('収支取得エラー:', error);
    }
  };

  const calculatePayout = (race: Race, betType: string, horseNames: string[]): number => {
    if (!race.result) return 0;

    const result = race.result;
    
    switch (betType) {
      case 'win':
        return horseNames.includes(result["1着"] || '') ? 
               getOddsForHorse(race, result["1着"] || '') * betAmount : 0;
      
      case 'place':
        const placeHorses = [result["1着"], result["2着"]];
        for (const horseName of horseNames) {
          if (placeHorses.includes(horseName)) {
            return getOddsForHorse(race, horseName) * betAmount * 0.5; // 連対の場合のオッズは約半分
          }
        }
        return 0;
      
      case 'show':
        const showHorses = [result["1着"], result["2着"], result["3着"]];
        for (const horseName of horseNames) {
          if (showHorses.includes(horseName)) {
            return getOddsForHorse(race, horseName) * betAmount * 0.3; // 複勝の場合のオッズは約1/3
          }
        }
        return 0;
      
      default:
        return 0;
    }
  };

  const getOddsForHorse = (race: Race, horseName: string): number => {
    const horse = race.horses.find(h => h.name === horseName);
    return horse ? horse.odds : 1.0;
  };

  const handleBetSubmit = async () => {
    if (!selectedRace || selectedHorses.length === 0) {
      alert('レースと馬を選択してください');
      return;
    }

    const race = races.find(r => r.id === selectedRace);
    if (!race) return;

    const payout = calculatePayout(race, betType, selectedHorses);
    const profit = payout - betAmount;

    const betRecord = {
      raceId: selectedRace,
      raceName: `${race.course} ${race.level}`,
      betType,
      horseNames: selectedHorses,
      betAmount,
      payout,
      profit
    };

    try {
      await axios.post('/api/bets', betRecord);
      alert(`馬券記録を追加しました！\n払戻: ${payout}円\n収支: ${profit >= 0 ? '+' : ''}${profit}円`);
      
      // リセット
      setSelectedRace('');
      setSelectedHorses([]);
      setBetAmount(100);
      fetchBetSummary();
    } catch (error) {
      console.error('馬券記録エラー:', error);
      alert('馬券記録の保存に失敗しました');
    }
  };

  const selectedRaceData = races.find(r => r.id === selectedRace);

  return (
    <div style={{ margin: '20px 0' }}>
      <h2>収支計算・馬券記録</h2>
      
      {/* 馬券購入記録 */}
      <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px' }}>
        <h3>馬券購入記録</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            レース選択:
            <select 
              value={selectedRace} 
              onChange={(e) => setSelectedRace(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">レースを選択</option>
              {races.map(race => (
                <option key={race.id} value={race.id}>
                  {race.date} {race.course} {race.level}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            券種:
            <select 
              value={betType} 
              onChange={(e) => setBetType(e.target.value as 'win' | 'place' | 'show')}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="win">単勝</option>
              <option value="place">連対</option>
              <option value="show">複勝</option>
            </select>
          </label>
        </div>

        {selectedRaceData && (
          <div style={{ marginBottom: '10px' }}>
            <label>
              馬選択:
              {selectedRaceData.horses.map(horse => (
                <label key={horse.horseNumber} style={{ display: 'block', marginLeft: '20px' }}>
                  <input
                    type="checkbox"
                    checked={selectedHorses.includes(horse.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedHorses([...selectedHorses, horse.name]);
                      } else {
                        setSelectedHorses(selectedHorses.filter(name => name !== horse.name));
                      }
                    }}
                  />
                  {horse.name} (オッズ: {horse.odds}倍, {horse.popularity}番人気)
                </label>
              ))}
            </label>
          </div>
        )}

        <div style={{ marginBottom: '10px' }}>
          <label>
            購入金額:
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              style={{ marginLeft: '10px', padding: '5px' }}
              min="100"
              step="100"
            />
            円
          </label>
        </div>

        <button onClick={handleBetSubmit} style={{ padding: '8px 16px' }}>
          馬券を記録
        </button>
      </div>

      {/* 収支サマリー */}
      {betSummary && (
        <div style={{ border: '1px solid #ddd', padding: '15px' }}>
          <h3>収支サマリー</h3>
          <p>総投資額: {betSummary.totalBets.toLocaleString()}円</p>
          <p>総払戻額: {betSummary.totalPayout.toLocaleString()}円</p>
          <p style={{ color: betSummary.totalProfit >= 0 ? 'green' : 'red' }}>
            総収支: {betSummary.totalProfit >= 0 ? '+' : ''}{betSummary.totalProfit.toLocaleString()}円
          </p>
          <p>的中率: {betSummary.winRate.toFixed(1)}%</p>
          
          <h4>購入履歴</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>レース</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>券種</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>馬名</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>投資額</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>払戻</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>収支</th>
              </tr>
            </thead>
            <tbody>
              {betSummary.records.map((record, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{record.raceName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {record.betType === 'win' ? '単勝' : record.betType === 'place' ? '連対' : '複勝'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {record.horseNames.join(', ')}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {record.betAmount.toLocaleString()}円
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {record.payout.toLocaleString()}円
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', color: record.profit >= 0 ? 'green' : 'red' }}>
                    {record.profit >= 0 ? '+' : ''}{record.profit.toLocaleString()}円
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BetCalculator;