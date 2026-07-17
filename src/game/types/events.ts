import type { BadEffect, BonusEffect } from './config';
import type { GameEvent } from '../constants/Events';
import type { ItemCategory } from './config';

export interface EventMap {
  'item:collected': {
    readonly id: string;
    readonly category: ItemCategory;
    readonly scoreDelta: number;
  };
  'item:missed': {
    readonly id: string;
    readonly category: ItemCategory;
  };
  'combo:changed': { readonly combo: number };
  'strike:changed': { readonly strike: number };
  'score:changed': { readonly score: number; readonly weddingFund: number };
  'stage:changed': {
    readonly stage: number;
    readonly name: string;
    readonly description: string;
    readonly background: string;
  };
  'time:changed': { readonly elapsedMs: number };
  'bonus:activated': {
    readonly effect: BonusEffect | BadEffect;
    readonly id: string;
    readonly durationMs: number;
  };
  'game:over': {
    readonly score: number;
    readonly weddingFund: number;
    readonly maxCombo: number;
    readonly strike: number;
    readonly reason: 'strike';
  };
  'hud:refresh': Record<string, never>;
}

export type EventPayload<K extends GameEvent> = EventMap[K];
