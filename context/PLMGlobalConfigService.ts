type ConfigFn = ((key: string, value: any, persist?: boolean) => void) | null;
type GetFn = <T = any>(key: string) => T | undefined;

class PLMGlobalConfigService {
  private setFn: ConfigFn = null;
  private getFn: GetFn | null = null;

  register(set: ConfigFn, get: GetFn) {
    this.setFn = set;
    this.getFn = get;
  }

  set(key: string, value: any, persist = false) {
    if (!this.setFn) {
      console.warn("PLMGlobalConfig not initialized yet!");
      return;
    }
    this.setFn(key, value, persist);
  }

  get<T = any>(key: string): T | undefined {
    if (!this.getFn) {
      console.warn("PLMGlobalConfig not initialized yet!");
      return undefined;
    }
    return this.getFn<T>(key);
  }
}

export const PLMGlobalConfigServiceInstance = new PLMGlobalConfigService();
