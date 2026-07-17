/**
 * Layer order from Character Bible §3.8.
 */
export const Depth = {
  Background: 0,
  /** Stage label / combo flavor — behind falling items & couple. */
  Atmosphere: 30,
  CharactersTop: 50,
  Items: 100,
  Player: 200,
  Particles: 300,
  Hud: 400,
  Popup: 500,
} as const;

export type DepthLayer = (typeof Depth)[keyof typeof Depth];
