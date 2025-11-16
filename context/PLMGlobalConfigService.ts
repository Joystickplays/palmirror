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
    if (!this.setFn) throw new Error("PLMGlobalConfig not initialized yet!");
    this.setFn(key, value, persist);
  }

  get<T = any>(key: string): T | undefined {
    if (!this.getFn) throw new Error("PLMGlobalConfig not initialized yet!");
    return this.getFn<T>(key);
  }
}

export const PLMGlobalConfigServiceInstance = new PLMGlobalConfigService();
