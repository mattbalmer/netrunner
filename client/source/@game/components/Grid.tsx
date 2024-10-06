import { FlexCol } from '@client/components/FlexCol';
import * as React from 'react';
import { Dir, Game, NodeID, NodeMap } from '@game/types';
import { Box, Typography } from '@mui/material';
import { coordToString, getEdgeDirs } from '@game/utils/grid';
import { FlexRow } from '@client/components/FlexRow';

const Spacer = () => {
  return <Box sx={{ width: 50, height: 50 }} />
}

const Node = ({ id, coord, selected, exist, isVisited, isOpened }: {
  id: string,
  coord: string,
  selected: boolean,
  exist?: boolean,
  isVisited?: boolean,
  isOpened?: boolean,
}) => {
  const color = selected ? '#c44'
    : isOpened ? '#454'
    : isVisited ? '#8c8'
    : exist ? '#44c'
    : '#222';

  if (!exist) return <Spacer />

  return <Box
    data-key={coord}
    sx={{
      width: 50,
      height: 50,
      background: color,
      border: '1px solid white',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
    }}
  >
    <Typography variant={'subtitle1'}>{id}</Typography>
  </Box>
}

const Edge = ({ id, dirs }: {
  id: string,
  dirs: Dir[],
}) => {
  return <Box
    data-key={id}
    sx={{
      position: 'relative',
      width: 50,
      height: 50,
    }}
  >
    {dirs.filter(dir => dir === 'left' || dir === 'up').map(dir => {
      return <Box
        key={dir}
        data-key={dir}
        sx={{
          width: dir === 'left' ? 30 : 10,
          height: dir === 'up' ? 30 : 10,
          background: 'green',
          border: '1px solid white',
          borderRadius: 10,
          position: 'absolute',
          top: dir === 'up' ? 10 : '50%',
          left: dir === 'left' ? 10 : '50%',
          transform: dir === 'up' ? 'translateX(-50%)' : 'translateY(-50%)',
          boxSizing: 'border-box',
        }}
      />
    })}
  </Box>
}


export const Grid = ({
  size,
  hoveredNodeXY,
  nodeMap,
  game,
}: {
  size: [number, number],
  hoveredNodeXY: NodeID,
  nodeMap: NodeMap,
  game: Game,
}) => {
  const sizeList = Array
    .from({ length: size[1] - size[0] + 1 }, (_, i) => i + size[0])
    .reduce((s, n) => [...s, n, n + 0.5], [])
    .slice(0, -1);

  return <FlexRow sx={{ flexGrow: 1, position: 'relative' }}>
    <>
      {sizeList.slice(0).map(x => {
        return <FlexCol
          key={`${x}`}
          sx={{ alignItems: 'center' }}
        >
          {sizeList.slice(0).map(y => {
            const coordStr = coordToString({ x, y });
            const node = game.nodes[nodeMap[coordStr]];
            if (x % 1 === 0 && y % 1 === 0) {
              return <Node
                id={nodeMap[coordStr]}
                coord={coordStr}
                key={coordStr}
                selected={coordStr === hoveredNodeXY}
                exist={coordStr in nodeMap}
                isOpened={node?.isOpened}
                isVisited={node?.isVisited}
              />
            } else {
              return <Spacer key={coordStr} />
            }
          })}
        </FlexCol>
      })}
    </>
    <FlexRow sx={{ position: 'absolute', flexGrow: 1 }}>
      <>
        {Object.entries(game.edges).map(([connecting, type]) => {
          const [start, end] = connecting.split(':');
          const startNode = game.nodes[start];
          const endNode = game.nodes[end];

          const midX = (endNode.x + startNode.x) / 2;
          const midY = (endNode.y + startNode.y) / 2;

          const intervalsFromTop = midY - sizeList[0];
          const intervalsFromLeft = midX - sizeList[0];

          const dirs: Dir[] = midX === startNode.x ? ['up'] : ['left'];

          return <FlexRow
            key={coordToString({ x: midX, y: midY })}
            sx={{ position: 'absolute', top: 100 * intervalsFromTop, left: 100 * intervalsFromLeft }}
          >
            <Edge
              id={coordToString({ x: midX, y: midY })}
              dirs={dirs}
            />
          </FlexRow>
        })}
      </>
    </FlexRow>
  </FlexRow>
}