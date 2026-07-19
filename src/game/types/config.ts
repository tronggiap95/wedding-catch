export type ItemCategory = 'good' | 'bad' | 'bonus';

export type ItemRarity =
  | 'common'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export type BonusEffect = 'magnet' | 'double_score' | 'invincible';

/** Special bad-item effects (no strike; category stays `bad`). */
export type BadEffect = 'repel' | 'drunk';

export interface RuntimeConfigFile {
  readonly maxStrikes: number;
  readonly playerSpeed: number;
  readonly playerWidth: number;
  readonly playerHeight: number;
  readonly itemSize: number;
  readonly hitboxShrink: number;
  readonly weddingFundPerScore: number;
  readonly countdownMs: number;
}

export interface StageDefinition {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly durationMs: number;
  readonly spawnInterval: number;
  readonly bonusInterval: number;
  readonly goodChance: number;
  readonly fallSpeed: number;
  readonly maxConcurrent: number;
  readonly background: string;
}

/** Difficulty ramp applied every stage duration after the last named stage. */
export interface EndlessStageConfig {
  readonly fallSpeedMul: number;
  readonly spawnIntervalMul: number;
  readonly goodChanceStep: number;
  readonly maxFallSpeed: number;
  readonly minSpawnInterval: number;
  readonly minGoodChance: number;
  readonly maxConcurrent: number;
  readonly name: string;
  readonly description: string;
}

export interface StagesConfigFile {
  readonly stages: readonly StageDefinition[];
  readonly endless: EndlessStageConfig;
}

export interface ComboTier {
  readonly minCombo: number;
  readonly multiplier: number;
}

export interface ItemDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'good' | 'bad';
  readonly rarity: ItemRarity;
  readonly score: number;
  readonly spawnWeight: number;
  readonly minStage: number;
  readonly color: string;
  readonly label: string;
  readonly texture: string;
  /** Special bad: darker border, optional effect, no strike on catch. */
  readonly special?: boolean;
  readonly badEffect?: BadEffect;
  /** Multiplier applied to stage fall speed at spawn (e.g. 2 = twice as fast). */
  readonly fallSpeedMul?: number;
  readonly effectDurationMs?: number;
}

export interface ItemsConfigFile {
  readonly rarityWeights: Readonly<Record<ItemRarity, number>>;
  readonly comboTiers: readonly ComboTier[];
  readonly items: readonly ItemDefinition[];
}

export interface BonusDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly effect: BonusEffect;
  readonly durationMs: number;
  readonly timeBonusMs?: number;
  readonly spawnWeight: number;
  readonly minStage: number;
  readonly color: string;
  readonly label: string;
  readonly texture: string;
}

export interface BonusConfigFile {
  readonly bonuses: readonly BonusDefinition[];
}

export type SpawnableDefinition = ItemDefinition | BonusDefinition;

export function isBonusDefinition(
  def: SpawnableDefinition,
): def is BonusDefinition {
  return 'effect' in def;
}

export function isSpecialBad(def: SpawnableDefinition): boolean {
  return (
    !isBonusDefinition(def) &&
    def.category === 'bad' &&
    def.special === true
  );
}
