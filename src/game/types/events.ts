import type { ItemType } from '../constants/ItemType';
import type { GameEvent } from '../constants/Events';

/** Payload contracts for {@link GameEvent} names. */
export interface EventMap {
  'item:caught': { readonly type: ItemType; readonly score: number };
  'item:missed': { readonly type: ItemType };
  'score:changed': { readonly score: number };
  'lives:changed': { readonly lives: number };
  'level:started': { readonly levelId: string };
  'level:completed': { readonly levelId: string; readonly score: number };
  'game:over': { readonly score: number };
}

export type EventPayload<K extends GameEvent> = EventMap[K];
