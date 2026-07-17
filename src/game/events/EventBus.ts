import Phaser from 'phaser';
import type { GameEvent } from '../constants/Events';
import type { EventMap } from '../types/events';

/**
 * Process-wide event bus. Decouples systems without React involvement.
 * Typed emit/on helpers keep payloads honest without a heavy framework.
 */
class GameEventBus {
  private readonly emitter = new Phaser.Events.EventEmitter();

  public emit<K extends GameEvent>(event: K, payload: EventMap[K]): void {
    this.emitter.emit(event, payload);
  }

  public on<K extends GameEvent>(
    event: K,
    callback: (payload: EventMap[K]) => void,
    context?: object,
  ): void {
    this.emitter.on(event, callback, context);
  }

  public once<K extends GameEvent>(
    event: K,
    callback: (payload: EventMap[K]) => void,
    context?: object,
  ): void {
    this.emitter.once(event, callback, context);
  }

  public off<K extends GameEvent>(
    event: K,
    callback?: (payload: EventMap[K]) => void,
    context?: object,
  ): void {
    this.emitter.off(event, callback, context);
  }

  public removeAllListeners(event?: GameEvent): void {
    this.emitter.removeAllListeners(event);
  }
}

export const EventBus = new GameEventBus();
