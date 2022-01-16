import browser from 'webextension-polyfill'

const defaultStorage: RedEyesStorage = {
  filters: [],
  filterDatas: {},
  manuallyIdentified: [],
}

export async function loadLocalStorage(): Promise<RedEyesStorage> {
  const storage = await browser.storage.local.get()
  return Object.assign(Object.create(null), defaultStorage, storage)
}

export async function loadLocalStorageOnlyFilters(): Promise<{ filters: RedEyesStorage['filters'] }> {
  const storage = await browser.storage.local.get('filters') as any
  storage.filters ??= []
  return storage
}

export async function loadLocalStorageOnlyManuallyIdentified(): Promise<
  { manuallyIdentified: RedEyesStorage['manuallyIdentified'] }
> {
  const storage = await browser.storage.local.get('manuallyIdentified') as any
  storage.manuallyIdentified ??= []
  return storage
}

export async function saveLocalStorage(storage: Partial<RedEyesStorage>) {
  browser.storage.local.set(storage)
}
