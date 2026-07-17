/**
 * Catchable / interactive item kinds.
 * Values are stable IDs used by data configs and spawners.
 */
export const ItemType = {
  Bouquet: 'bouquet',
  Ring: 'ring',
  Envelope: 'envelope',
  Champagne: 'champagne',
  Obstacle: 'obstacle',
} as const;

export type ItemType = (typeof ItemType)[keyof typeof ItemType];
