import { t } from '../i18n';

const STORAGE_KEY = 'wedding-catch.guestProfile';
const MAX_LEN = 18;

export type GuestGender = 'male' | 'female';

type Listener = () => void;

interface StoredProfile {
  readonly name: string | null;
  readonly gender: GuestGender;
}

/**
 * Persisted guest name + gender for welcome, name tag, and thrower art.
 */
export class GuestNameStore {
  private name: string | null;
  private gender: GuestGender;
  private readonly listeners = new Set<Listener>();

  public constructor() {
    const stored = readStored();
    this.name = stored.name;
    this.gender = stored.gender;
  }

  public getDisplayName(): string {
    const custom = this.name?.trim();
    if (custom !== undefined && custom !== '') {
      return custom;
    }
    return t('guest.defaultName');
  }

  public getGender(): GuestGender {
    return this.gender;
  }

  public hasCustomName(): boolean {
    return this.name !== null && this.name.trim() !== '';
  }

  public setName(raw: string): void {
    const cleaned = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_LEN);
    const next = cleaned === '' ? null : cleaned;
    if (next === this.name) {
      return;
    }
    this.name = next;
    this.persist();
    this.emit();
  }

  public setGender(gender: GuestGender): void {
    if (this.gender === gender) {
      return;
    }
    this.gender = gender;
    this.persist();
    this.emit();
  }

  public setProfile(rawName: string, gender: GuestGender): void {
    const cleaned = rawName.trim().replace(/\s+/g, ' ').slice(0, MAX_LEN);
    this.name = cleaned === '' ? null : cleaned;
    this.gender = gender;
    this.persist();
    this.emit();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private persist(): void {
    try {
      const payload: StoredProfile = {
        name: this.name,
        gender: this.gender,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // private mode — keep in-memory only
    }
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

function readStored(): StoredProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<StoredProfile>;
      const gender =
        parsed.gender === 'female' || parsed.gender === 'male'
          ? parsed.gender
          : 'male';
      const name =
        typeof parsed.name === 'string' && parsed.name.trim() !== ''
          ? parsed.name.trim().slice(0, MAX_LEN)
          : null;
      return { name, gender };
    }
    // Migrate legacy name-only key.
    const legacy = localStorage.getItem('wedding-catch.guestName');
    if (legacy !== null && legacy.trim() !== '') {
      return { name: legacy.trim().slice(0, MAX_LEN), gender: 'male' };
    }
  } catch {
    // ignore
  }
  return { name: null, gender: 'male' };
}

export const guestNameStore = new GuestNameStore();
export const GUEST_NAME_MAX_LEN = MAX_LEN;

/** Fixed couple names used in personalized dialogue. */
export const COUPLE_NAMES = {
  bride: 'Minh Thy',
  groom: 'Trọng Giáp',
} as const;
