import browser from 'webextension-polyfill'

const defaultStorage = {
  filters: [],
  filterDatas: {},
  manuallyIdentified: [],
}

export async function loadLocalStorage() {
  const storage = await browser.storage.local.get()
  return Object.assign(Object.create(null), defaultStorage, storage)
}

export async function loadLocalStorageOnlyFilters() {
  const storage = await browser.storage.local.get('filters')
  storage.filters ??= []
  return storage
}

export async function loadLocalStorageOnlyManuallyIdentified() {
  const storage = await browser.storage.local.get('manuallyIdentified')
  storage.manuallyIdentified ??= []
  return storage
}

export async function saveLocalStorage(data) {
  browser.storage.local.set(data)
}