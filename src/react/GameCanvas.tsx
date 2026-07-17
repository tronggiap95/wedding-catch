import { useEffect, useRef, type JSX } from 'react';
import { Game } from '../game/Game';

/**
 * Sole React ↔ Phaser bridge. Mounts the game and destroys it on unmount.
 * No game logic belongs here.
 */
export function GameCanvas(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (parent === null || gameRef.current !== null) {
      return;
    }

    const game = new Game(parent);
    gameRef.current = game;

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="game-root" />;
}
