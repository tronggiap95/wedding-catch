/**
 * Mutable source of truth for the active run (GDD §2.50).
 */
export class GameState {
  public score = 0;
  public combo = 0;
  public maxCombo = 0;
  public strike = 0;
  public stage = 1;
  public elapsedMs = 0;
  public weddingFund = 0;
  public isPlaying = false;
  public isPaused = false;
  public isGameOver = false;
  public lastGameOverReason: 'strike' | null = null;

  public scoreMultiplier = 1;
  public magnetRemainingMs = 0;
  public repelRemainingMs = 0;
  public doubleScoreRemainingMs = 0;
  public invincibleRemainingMs = 0;

  public reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.strike = 0;
    this.stage = 1;
    this.elapsedMs = 0;
    this.weddingFund = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.lastGameOverReason = null;
    this.scoreMultiplier = 1;
    this.magnetRemainingMs = 0;
    this.repelRemainingMs = 0;
    this.doubleScoreRemainingMs = 0;
    this.invincibleRemainingMs = 0;
  }
}
