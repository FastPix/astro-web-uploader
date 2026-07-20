export class Emitter<EventMap> {
  readonly #listeners = new Map<keyof EventMap, Set<(detail: any) => void>>();

  on<K extends keyof EventMap>(evt: K, cb: (detail: EventMap[K]) => void): () => void {
    let set = this.#listeners.get(evt);
    if (!set) {
      set = new Set();
      this.#listeners.set(evt, set);
    }
    set.add(cb);
    return () => this.off(evt, cb);
  }

  off<K extends keyof EventMap>(evt: K, cb: (detail: EventMap[K]) => void): void {
    this.#listeners.get(evt)?.delete(cb);
  }

  emit<K extends keyof EventMap>(evt: K, detail: EventMap[K]): void {
    const set = this.#listeners.get(evt);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(detail);
      } catch {
        /* noop */
      }
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}
