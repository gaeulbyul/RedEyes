import browser from 'webextension-polyfill'

import colorPresets from './color-presets'

export const defaultStorage = Object.freeze<RedEyesStorage>({
  filters: [],
  filterDatas: Object.create(null),
  manuallyIdentified: Object.create(null),
  colors: Object.assign(Object.create(null), colorPresets[0]),
})

type RedEyesStorageOnly = {
  [key in keyof RedEyesStorage]: RedEyesStorage[key]
}

export async function loadLocalStorage(): Promise<RedEyesStorage> {
  const storage = await browser.storage.local.get()
  return Object.assign(Object.create(null), defaultStorage, storage)
}

export async function loadLocalStorageOnly(key: keyof RedEyesStorage): Promise<RedEyesStorageOnly> {
  const storage = await browser.storage.local.get(key) as any
  storage[key] ??= defaultStorage[key]
  return storage
}

export async function saveLocalStorage(storage: Partial<RedEyesStorage>) {
  browser.storage.local.set(storage)
}
