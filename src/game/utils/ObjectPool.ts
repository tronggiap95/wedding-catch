/**
 * Simple object pool — acquire/release without allocating in the hot path.
 */
export class ObjectPool<T> {
  private readonly available: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (item: T) => void;

  public constructor(
    factory: () => T,
    reset: (item: T) => void,
    initialSize = 12,
  ) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i += 1) {
      this.available.push(this.factory());
    }
  }

  public acquire(): T {
    return this.available.pop() ?? this.factory();
  }

  public release(item: T): void {
    this.reset(item);
    this.available.push(item);
  }

  public releaseAll(items: readonly T[]): void {
    for (const item of items) {
      this.release(item);
    }
  }
}
