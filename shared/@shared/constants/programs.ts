import { BehaviorArgs, CORE_COMMANDS, CoreCommand, Daemon, Game, Program } from '@shared/types/game';
import { appendMessages } from '@shared/utils/game/cli';
import { Daemons } from '@shared/constants/daemons';
import { executeCoreCommand } from '@shared/constants/commands';
import { ensure } from '@shared/utils/game/game';
import { consumeDice } from '@shared/utils/game/dice';
import { GameEffects } from '@shared/constants/effects';
import { CLIArgs } from '@shared/types/game/cli';

export const ProgramKeywords = {
  siphon: 'siphon',
  drill: 'drill',
  break: 'break',
} as const;
export type ProgramKeyword = keyof typeof ProgramKeywords;

export const Programs = {
  core1: () => ({
    id: 'core1',
    model: 'core',
    name: 'Core Commands',
    description: 'Contains basic commands for interacting with the matrix.',
    tags: [],
    features: [],
    stats: {},
    commands: Object.keys(CORE_COMMANDS) as ProgramKeyword[],
    onExecute: ({ game, command, args, derived }) => {
      return executeCoreCommand(command as CoreCommand, game, args, derived);
    }
  }),
  icedrill1: () => ({
    id: 'icedrill1',
    model: 'icedrill',
    name: 'ICE Drill',
    description: 'Allows the user to drill through basic ICE',
    tags: [],
    features: [],
    stats: {
      icedrilling: {
        barrier: 3,
        sentry: 3,
        codegate: 3,
      },
    },
    commands: [
      ProgramKeywords.drill,
    ],
    onExecute: ({ game, command, args, derived }) => {
      if (args.help) {
        return appendMessages(game, [{
          type: 'output',
          value: `Usage: drill [-d <dice>]`
        }, {
          type: 'output',
          value: `Drills through the ICE on the current node. Suffer any effects from still active layers.`
        }]);
      }

      const { hoveredNode } = derived;
      const RAM_COST = 1;

      ensure(hoveredNode?.ice, `No ICE to drill`);
      ensure(hoveredNode.ice.status === 'ACTIVE', `ICE is not active`);
      ensure(game.player.actions > 0, `No actions left`);
      ensure(game.player.ram.current >= RAM_COST, `Not enough RAM to drill ICE`);

      game = consumeDice(game, args);

      // complete all layers of ice
      game = hoveredNode.ice.complete(game);

      return {
        ...game,
        actionsToIncrement: game.actionsToIncrement + 1,
        player: {
          ...game.player,
          ram: {
            ...game.player.ram,
            current: Math.max(0, game.player.ram.current - RAM_COST),
          },
        },
        history: {
          ...game.history,
          terminal: [
            ...game.history.terminal,
            {
              type: 'output',
              value: `(${game.player.node}) drilled through Lvl${hoveredNode.ice.strength} ${hoveredNode.ice.id}`,
            },
          ],
        },
        stack: [
          ...game.stack,
          GameEffects.AddNoise({
            node: game.player.node,
            source: 'program',
            actor: 'player',
            amount: 1,
            round: game.round,
            duration: 2,
          }),
          GameEffects.AddNoise({
            node: game.player.node,
            source: 'ice',
            actor: 'network',
            amount: 1,
            round: game.round,
            duration: 2,
          }),
        ],
      };
    }
  }),
  hammer1: () => ({
    id: 'hammer1',
    model: 'hammer',
    name: 'Hammer 1',
    description: 'Allows the user to break basic Barrier ICE',
    tags: [],
    features: [],
    stats: {
      icedrilling: {
        barrier: 1,
        sentry: 0,
        codegate: 0,
      },
    },
    commands: [
      ProgramKeywords.break,
    ],
    onExecute: ({ game, command, args, derived }: BehaviorArgs<CLIArgs<{
      l: string,
    }>>) => {
      if (args.help) {
        return appendMessages(game, [{
          type: 'output',
          value: `Usage: break [-l <layer>] [-d <dice>]`
        }, {
          type: 'output',
          value: `Breaks a layer of ICE on the current node. If no <layer> is given, breaks the first layer`
        }]);
      }

      const { hoveredNode } = derived;
      const layer = parseInt(args.l) || 0;
      const RAM_COST = 2;

      ensure(hoveredNode?.ice, `No ICE to break`);
      ensure(hoveredNode.ice.status === 'ACTIVE', `ICE is not active`);
      ensure(
        !isNaN(layer) && layer >= 0 && layer < hoveredNode.ice.layers.length,
        `ICE has no layer '${layer}'`
      );
      ensure(
        hoveredNode.ice.layers[layer].status === 'ACTIVE',
          `Layer ${layer} is not active`
      );
      ensure(game.player.actions > 0, `No actions left`);
      ensure(game.player.ram.current >= RAM_COST, `Not enough RAM to drill ICE`);

      game = consumeDice(game, args);

      game = hoveredNode.ice.break(game, layer);

      // @ts-ignore
      const didBreakLayer = hoveredNode.ice.layers[layer].status === 'BROKEN';
      const isICEBroken = hoveredNode.ice.status === 'BROKEN';

      const diceUsed = args.d?.[0];
      const noiseGeneratedFromExcess = diceUsed - hoveredNode.ice.strength;

      return {
        ...game,
        actionsToIncrement: game.actionsToIncrement + 1,
        player: {
          ...game.player,
          ram: {
            ...game.player.ram,
            current: Math.max(0, game.player.ram.current - 2),
          }
        },
        history: {
          ...game.history,
          terminal: [
            ...game.history.terminal,
            {
              type: 'output',
              value: didBreakLayer
                ? isICEBroken ? `(${game.player.node}) broke Lvl${hoveredNode.ice.strength} ${hoveredNode.ice.id}` : `(${game.player.node}) broke layer ${layer} of Lvl${hoveredNode.ice.strength} ${hoveredNode.ice.id}`
                : `Failed to break layer ${layer} of Lvl${hoveredNode.ice.strength} ${hoveredNode.ice.id}`,
            },
          ],
        },
        stack: [
          ...game.stack,
          GameEffects.AddNoise({
            node: game.player.node,
            source: 'program',
            actor: 'player',
            amount: 1,
            round: game.round,
            duration: 2,
          }),
          didBreakLayer ? GameEffects.AddNoise({
            node: game.player.node,
            source: 'ice',
            actor: 'network',
            amount: 1,
            round: game.round,
            duration: 2,
          }) : null,
          isICEBroken ? GameEffects.AddNoise({
            node: game.player.node,
            source: 'ice',
            actor: 'network',
            amount: noiseGeneratedFromExcess,
            round: game.round,
            duration: 3,
          }) : null,
        ],
      };
    }
  }),
  siphon1: () => ({
    id: 'siphon1',
    model: 'siphon',
    commands: [
      ProgramKeywords.siphon,
    ],
    name: 'Siphon Program',
    description: 'Siphon $50 from a wallet each turn.',
    tags: [],
    features: [],
    stats: {},
    onExecute({ game, command}): Game {
      const power = 50;
      // Create SiphonDaemon at player's location, which will interact with Wallet at the location each turn for $50 per turn.

      const nodeContainsDaemon = Object.values(game.daemons)
        .some(d =>
          d.model === 'SimpleSiphoner' && d.node === game.player.node
        );

      if (nodeContainsDaemon) {
        return appendMessages(game, [{
          type: 'error',
          value: `A siphon daemon already exists at ${game.player.node}`,
        }]);
      }

      const daemon: Daemon = Daemons.SimpleSiphoner({
        id: game.daemonIDTracker.next('SimpleSiphoner'),
        node: game.player.node,
        status: 'ACTIVE',
        power,
        noise: 1,
        into: 'player',
        createdAtAction: game.currentAction,
      });

      daemon.onInit?.();

      game.daemons = {
        ...game.daemons,
        [daemon.id]: daemon,
      };

      game.actionsToIncrement += 1;

      return appendMessages(game, [{
        type: 'output',
        value: `Siphon Daemon created at ${game.player.node} with power ${power}`,
      }]);
    },
  }),
} as const satisfies Record<string, (...args: unknown[]) => Program>;