// client/src/components/RaceDetail.tsx
import React from 'react';
import { Race } from '../types';

interface Props {
  race: Race;
}

const RaceDetail: React.FC<Props> = ({ race }) => {
  return (
    <div>
      <h3>レース詳細</h3>
      <p>{race.course} - {race.distance}m - {race.surface} - {race.condition}</p>
      <h4>出走馬</h4>
      <ul>
        {race.horses.map((horse, idx) => (
          <li key={idx}>
            [{horse.frameNumber}-{horse.horseNumber}] {horse.name} ({horse.sex}{horse.age}) {horse.weight}kg {horse.jockey} / {horse.odds}倍（{horse.popularity}人気）
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RaceDetail;
