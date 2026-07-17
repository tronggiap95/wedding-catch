/**
 * Cross-system event names for Phaser's EventEmitter / a future EventBus.
 * Payload shapes should be declared next to the emitters that fire them.
 */
export const Events = {
  ItemCaught: 'item:caught',
  ItemMissed: 'item:missed',
  ScoreChanged: 'score:changed',
  LivesChanged: 'lives:changed',
  LevelStarted: 'level:started',
  LevelCompleted: 'level:completed',
  GameOver: 'game:over',
} as const;

export type GameEvent = (typeof Events)[keyof typeof Events];
