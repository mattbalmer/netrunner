import * as React from 'react';
import { FlexCol } from '@client/components/FlexCol';
import { GameScreen } from '@game/components/GameScreen';
import { NavBar } from '@client/components/NavBar';
import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Game } from '@shared/types/game';
import { Level } from '@shared/types/game/level';
import { Typography } from '@mui/material';
import { playerCapsule } from '@client/capsules/player';

const usePlayer = (levelID: string): Game['player'] => {
  return useMemo<Game['player']>(() => {
    const savedPlayer = playerCapsule.get('player');
    const previousHistoryForLevel = savedPlayer.history[levelID] ?? [0, 0];
    playerCapsule.set('player', {
      ...savedPlayer,
      history: {
        ...savedPlayer.history,
        [levelID]: [
          previousHistoryForLevel[0] + 1,
          previousHistoryForLevel[1],
        ],
      },
    });

    return {
      mental: savedPlayer.mental,
      ram: {
        max: savedPlayer.ram,
        current: savedPlayer.ram,
      },
      money: savedPlayer.money,
      actions: 2,
      stats: {
        ...savedPlayer.stats,
      },
      conditions: [],
    };
  }, []);
}

export const GamePage = () => {
  let { id } = useParams();

  const [level, setLevel] = useState<Level>(null);

  const player = usePlayer(id);

  useEffect(() => {
    fetch(`/api/levels/${id}`)
      .then((res) => res.json())
      .then((level) => {
        setLevel(level);
      });
  }, []);

  return <FlexCol sx={{ flexGrow: 1, height: '100vh', background: '#111' }}>
    <NavBar />
    {level ?
      <GameScreen
        levelID={id}
        level={level}
        player={player}
      />
      : <>
        <Typography>...Loading</Typography>
      </>
    }
  </FlexCol>
}