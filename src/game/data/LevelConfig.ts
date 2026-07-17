import { ItemType } from '../constants/ItemType';
import { DifficultyId } from './Difficulty';

export interface LevelDefinition {
  readonly id: string;
  readonly name: string;
  readonly difficulty: DifficultyId;
  /** Target score to clear the level; omit for endless modes later. */
  readonly targetScore: number;
  readonly durationMs: number;
  readonly spawnPool: readonly ItemType[];
}

/**
 * Ordered level catalogue. Game flow advances by index or id.
 */
export const LevelConfig: readonly LevelDefinition[] = [
  {
    id: 'level-1',
    name: 'Garden Warm-Up',
    difficulty: DifficultyId.Easy,
    targetScore: 100,
    durationMs: 60_000,
    spawnPool: [ItemType.Bouquet, ItemType.Envelope],
  },
  {
    id: 'level-2',
    name: 'Ceremony Catch',
    difficulty: DifficultyId.Normal,
    targetScore: 250,
    durationMs: 75_000,
    spawnPool: [
      ItemType.Bouquet,
      ItemType.Ring,
      ItemType.Envelope,
      ItemType.Obstacle,
    ],
  },
  {
    id: 'level-3',
    name: 'Reception Rush',
    difficulty: DifficultyId.Hard,
    targetScore: 400,
    durationMs: 90_000,
    spawnPool: [
      ItemType.Bouquet,
      ItemType.Ring,
      ItemType.Envelope,
      ItemType.Champagne,
      ItemType.Obstacle,
    ],
  },
];

export function getLevelById(id: string): LevelDefinition | undefined {
  return LevelConfig.find((level) => level.id === id);
}
