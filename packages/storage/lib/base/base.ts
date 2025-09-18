/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import type { BaseStorage, StorageConfig, ValueOrUpdate } from './types';
import { SessionAccessLevelEnum, StorageEnum } from './enums';

/**
 * Cross-browser WebExtension storage helpers.
 * - Prefer `browser.*` (webextension-polyfill) when available
 * - Fall back to `chrome.*` and wrap callback APIs into Promises
 */
const chromeRef: typeof globalThis.chrome | undefined = (globalThis as any).chrome;
const browserRef: any = (globalThis as any).browser;

type PromisifiedStorageArea = {
  get: (keys?: string[] | string | null) => Promise<Record<string, any>>;
  set: (items: Record<string, any>) => Promise<void>;
  onChanged: typeof chrome.storage.onChanged;
  setAccessLevel?: (options: { accessLevel: SessionAccessLevelEnum }) => Promise<void> | void;
};

function getPromisifiedStorageArea(storageEnum: StorageEnum): PromisifiedStorageArea | null {
  // Use browser.* first (Promise-based via webextension-polyfill)
  if (browserRef?.storage?.[storageEnum]) {
    const area = browserRef.storage[storageEnum];
    return {
      get: (keys?: string[] | string | null) => area.get(keys),
      set: (items: Record<string, any>) => area.set(items),
      onChanged: browserRef.storage.onChanged,
      setAccessLevel: area?.setAccessLevel?.bind(area),
    } as PromisifiedStorageArea;
  }

  // Fallback to chrome.* and promisify callbacks when necessary
  const c = chromeRef as any;
  if (c?.storage?.[storageEnum]) {
    const area = c.storage[storageEnum];

    const get = (keys?: any) =>
      new Promise<Record<string, any>>(resolve => {
        try {
          const maybe = area.get(keys);
          if (maybe && typeof maybe.then === 'function') return void maybe.then(resolve);
        } catch (_) {
          // ignore and fallback to callback style
        }
        area.get(keys, (result: any) => resolve(result ?? {}));
      });

    const set = (items: Record<string, any>) =>
      new Promise<void>(resolve => {
        try {
          const maybe = area.set(items);
          if (maybe && typeof maybe.then === 'function') return void maybe.then(() => resolve());
        } catch (_) {
          // ignore and fallback to callback style
        }
        area.set(items, () => resolve());
      });

    const onChanged = c.storage.onChanged as typeof chrome.storage.onChanged;

    const setAccessLevel = area.setAccessLevel
      ? (options: { accessLevel: SessionAccessLevelEnum }) => {
          try {
            const maybe = area.setAccessLevel(options);
            if (maybe && typeof maybe.then === 'function') return maybe;
          } catch (_) {
            // best-effort; some browsers may not support setAccessLevel
          }
        }
      : undefined;

    return { get, set, onChanged, setAccessLevel } as PromisifiedStorageArea;
  }

  return null;
}

/**
 * Sets or updates an arbitrary cache with a new value or the result of an update function.
 */
async function updateCache<D>(valueOrUpdate: ValueOrUpdate<D>, cache: D | null): Promise<D> {
  // Type guard to check if our value or update is a function
  function isFunction<D>(value: ValueOrUpdate<D>): value is (prev: D) => D | Promise<D> {
    return typeof value === 'function';
  }

  // Type guard to check in case of a function, if its a Promise
  function returnsPromise<D>(func: (prev: D) => D | Promise<D>): func is (prev: D) => Promise<D> {
    // Use ReturnType to infer the return type of the function and check if it's a Promise
    return (func as (prev: D) => Promise<D>) instanceof Promise;
  }

  if (isFunction(valueOrUpdate)) {
    // Check if the function returns a Promise
    if (returnsPromise(valueOrUpdate)) {
      return valueOrUpdate(cache as D);
    } else {
      return valueOrUpdate(cache as D);
    }
  } else {
    return valueOrUpdate;
  }
}

/**
 * If one session storage needs access from content scripts, we need to enable it globally.
 * @default false
 */
let globalSessionAccessLevelFlag: StorageConfig['sessionAccessForContentScripts'] = false;

/**
 * Checks if the storage permission is granted in the manifest.json.
 */
function checkStoragePermission(storageEnum: StorageEnum): void {
  const exists = Boolean(browserRef?.storage?.[storageEnum] ?? chromeRef?.storage?.[storageEnum]);
  if (!exists) {
    throw new Error(`Check your storage permission in manifest.json: ${storageEnum} is not defined`);
  }
}

/**
 * Creates a storage area for persisting and exchanging data.
 */
export function createStorage<D = string>(key: string, fallback: D, config?: StorageConfig<D>): BaseStorage<D> {
  let cache: D | null = null;
  let initedCache = false;
  let listeners: Array<() => void> = [];

  const storageEnum = config?.storageEnum ?? StorageEnum.Local;
  const liveUpdate = config?.liveUpdate ?? false;

  const serialize = config?.serialization?.serialize ?? ((v: D) => v);
  const deserialize = config?.serialization?.deserialize ?? (v => v as D);

  // Set global session storage access level for StoryType.Session, only when not already done but needed.
  if (
    globalSessionAccessLevelFlag === false &&
    storageEnum === StorageEnum.Session &&
    config?.sessionAccessForContentScripts === true
  ) {
    checkStoragePermission(storageEnum);
    try {
      const area = getPromisifiedStorageArea(storageEnum);
      if (area?.setAccessLevel) {
        const maybe = area.setAccessLevel({
          accessLevel: SessionAccessLevelEnum.ExtensionPagesAndContentScripts,
        });
        if (maybe && typeof (maybe as any).then === 'function') {
          (maybe as Promise<void>).catch(() => {});
        }
      }
    } catch (error) {
      console.warn(error);
      console.warn('Please call setAccessLevel into different context, like a background script.');
    }
    globalSessionAccessLevelFlag = true;
  }

  // Register life cycle methods
  const get = async (): Promise<D> => {
    checkStoragePermission(storageEnum);
    const area = getPromisifiedStorageArea(storageEnum);
    const value = (await area?.get?.([key])) as Record<string, any> | undefined;

    if (!value) {
      return fallback;
    }

    return deserialize(value[key]) ?? fallback;
  };

  const _emitChange = () => {
    listeners.forEach(listener => listener());
  };

  const set = async (valueOrUpdate: ValueOrUpdate<D>) => {
    if (!initedCache) {
      cache = await get();
    }
    cache = await updateCache(valueOrUpdate, cache);

    const area = getPromisifiedStorageArea(storageEnum);
    await area?.set?.({ [key]: serialize(cache) });
    _emitChange();
  };

  const subscribe = (listener: () => void) => {
    listeners = [...listeners, listener];

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  const getSnapshot = () => {
    return cache;
  };

  get().then(data => {
    cache = data;
    initedCache = true;
    _emitChange();
  });

  // Listener for live updates from the browser
  async function _updateFromStorageOnChanged(changes: { [key: string]: chrome.storage.StorageChange }) {
    // Check if the key we are listening for is in the changes object
    if (changes[key] === undefined) return;

    const valueOrUpdate: ValueOrUpdate<D> = deserialize(changes[key].newValue);

    if (cache === valueOrUpdate) return;

    cache = await updateCache(valueOrUpdate, cache);

    _emitChange();
  }

  // Register listener for live updates for our storage area
  if (liveUpdate) {
    const area = getPromisifiedStorageArea(storageEnum);
    area?.onChanged.addListener(_updateFromStorageOnChanged);
  }

  return {
    get,
    set,
    getSnapshot,
    subscribe,
  };
}
