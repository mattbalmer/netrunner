import { Ice, Installation, Trap } from '@game/types/game';
import { GameEffect } from '@game/constants/effects';

export type Coord = { x: number, y: number };
export type CoordString = `${number},${number}`;
export type NodeID = `${string}`;
export type EdgeString = `${string}:${string}`;
export type Dir = 'up' | 'down' | 'right' | 'left';
export type CompassCardinal = 'N' | 'S' | 'E' | 'W';
export type CompassDir = CompassCardinal | 'NE' | 'NW' | 'SE' | 'SW';

export type Node = {
  x: number,
  y: number,
  ice?: Ice,
  content?: ({ type: 'trap' } & Trap) | ({ type: 'installation' } & Installation),
  isVisited?: boolean,
  isOpened?: boolean,
}

export type Game = {
  nodes: Record<NodeID, Node>,
  edges: Record<EdgeString, 'oneway' | 'bi'>,
  hovered: NodeID,
  player: {
    mental: number,
    ram: number,
    money: number,
    actions: number,
    stats: {
      icebreaker: number,
    },
  },
  stack: GameEffect[],
  round: number,
}

export type NodeMap = Record<CoordString, NodeID>;

export const COMMANDS = {
  'm': 'move',
  'n': 'nav',
  'move': true,
  'nav': true,
  'info': true,
  'open': true,
  'retreat': true,
  'drill': true,
  'break': true,
} as const;

export type Command = keyof typeof COMMANDS;
export type CommandArgs = {
  move: [string],
  info: [],
};