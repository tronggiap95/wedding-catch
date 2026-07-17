import type Phaser from 'phaser';
import type {
  BonusConfigFile,
  ItemsConfigFile,
  RuntimeConfigFile,
  StagesConfigFile,
} from '../types/config';

/**
 * Loaded gameplay configs. Managers read from here — never hard-code balance.
 */
export class ConfigStore {
  public readonly runtime: RuntimeConfigFile;
  public readonly stages: StagesConfigFile;
  public readonly items: ItemsConfigFile;
  public readonly bonuses: BonusConfigFile;

  public constructor(
    runtime: RuntimeConfigFile,
    stages: StagesConfigFile,
    items: ItemsConfigFile,
    bonuses: BonusConfigFile,
  ) {
    this.runtime = runtime;
    this.stages = stages;
    this.items = items;
    this.bonuses = bonuses;
  }

  public static fromCache(cache: Phaser.Cache.CacheManager): ConfigStore {
    return new ConfigStore(
      cache.json.get('runtime') as RuntimeConfigFile,
      cache.json.get('stages') as StagesConfigFile,
      cache.json.get('items') as ItemsConfigFile,
      cache.json.get('bonuses') as BonusConfigFile,
    );
  }
}
