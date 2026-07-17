import { ItemType } from '../constants/ItemType';

export interface ItemDefinition {
  readonly type: ItemType;
  readonly textureKey: string;
  readonly score: number;
  readonly fallSpeed: number;
  readonly isHazard: boolean;
}

/**
 * Static item catalogue. Spawners and collisions read from here
 * instead of hard-coding stats in scenes.
 */
export const ItemConfig: Readonly<Record<ItemType, ItemDefinition>> = {
  [ItemType.Bouquet]: {
    type: ItemType.Bouquet,
    textureKey: 'item-bouquet',
    score: 10,
    fallSpeed: 120,
    isHazard: false,
  },
  [ItemType.Ring]: {
    type: ItemType.Ring,
    textureKey: 'item-ring',
    score: 25,
    fallSpeed: 160,
    isHazard: false,
  },
  [ItemType.Envelope]: {
    type: ItemType.Envelope,
    textureKey: 'item-envelope',
    score: 15,
    fallSpeed: 140,
    isHazard: false,
  },
  [ItemType.Champagne]: {
    type: ItemType.Champagne,
    textureKey: 'item-champagne',
    score: 20,
    fallSpeed: 150,
    isHazard: false,
  },
  [ItemType.Obstacle]: {
    type: ItemType.Obstacle,
    textureKey: 'item-obstacle',
    score: 0,
    fallSpeed: 130,
    isHazard: true,
  },
};
