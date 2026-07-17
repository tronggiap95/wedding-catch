export const DifficultyId = {
  Easy: 'easy',
  Normal: 'normal',
  Hard: 'hard',
} as const;

export type DifficultyId = (typeof DifficultyId)[keyof typeof DifficultyId];

export interface DifficultySettings {
  readonly id: DifficultyId;
  readonly label: string;
  readonly spawnIntervalMs: number;
  readonly fallSpeedMultiplier: number;
  readonly hazardChance: number;
  readonly startingLives: number;
}

/**
 * Difficulty presets. Levels reference an id; tuning stays in one place.
 */
export const Difficulty: Readonly<Record<DifficultyId, DifficultySettings>> = {
  [DifficultyId.Easy]: {
    id: DifficultyId.Easy,
    label: 'Easy',
    spawnIntervalMs: 1400,
    fallSpeedMultiplier: 0.85,
    hazardChance: 0.1,
    startingLives: 5,
  },
  [DifficultyId.Normal]: {
    id: DifficultyId.Normal,
    label: 'Normal',
    spawnIntervalMs: 1100,
    fallSpeedMultiplier: 1,
    hazardChance: 0.18,
    startingLives: 3,
  },
  [DifficultyId.Hard]: {
    id: DifficultyId.Hard,
    label: 'Hard',
    spawnIntervalMs: 800,
    fallSpeedMultiplier: 1.25,
    hazardChance: 0.28,
    startingLives: 2,
  },
};
