type ConfigFn = ((key: string, value: any, persist?: boolean) => void) | null;
type GetFn = <T = any>(key: string) => T | undefined;

const PREFIX = "PLMGC_";

class PLMGlobalConfigService {
  private setFn: ConfigFn = null;
  private getFn: GetFn | null = null;

  register(set: ConfigFn, get: GetFn) {
    this.setFn = set;
    this.getFn = get;
  }

  set(key: string, value: any, persist = false) {
    if (!this.setFn) {
      if (persist) {
        try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
      }
      return;
    }
    this.setFn(key, value, persist);
  }

  get<T = any>(key: string): T | undefined {
    if (this.getFn) {
      return this.getFn<T>(key);
    }
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
}

export const PLMGlobalConfigServiceInstance = new PLMGlobalConfigService();
