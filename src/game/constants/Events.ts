/**
 * Cross-system event names (GDD §2.23 + strike/score HUD).
 */
export const Events = {
  ItemCollected: 'item:collected',
  ItemMissed: 'item:missed',
  ComboChanged: 'combo:changed',
  StrikeChanged: 'strike:changed',
  ScoreChanged: 'score:changed',
  StageChanged: 'stage:changed',
  TimeChanged: 'time:changed',
  BonusActivated: 'bonus:activated',
  GameOver: 'game:over',
  HudRefresh: 'hud:refresh',
} as const;

export type GameEvent = (typeof Events)[keyof typeof Events];
