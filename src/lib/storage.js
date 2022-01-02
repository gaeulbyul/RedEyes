const defaultStorage = {
  filters: [],
  filterDatas: {},
}

export async function loadLocalStorage() {
  const storage = await browser.storage.local.get()
  return Object.assign({}, defaultStorage, storage)
}

export async function loadLocalStorageOnlyFilters() {
  const storage = await browser.storage.local.get('filters')
  storage.filters ??= []
  return storage
}

export async function saveLocalStorage(data) {
  browser.storage.local.set(data)
}

export async function removeFilterById(filterId) {
  const storage = await loadLocalStorage()
  const filters = storage.filters.filter(function (f) {
    return f.id !== filterId
  })
  return saveLocalStorage({
    filters: filters,
    filterDatas: storage.filterDatas,
  })
}

export async function toggleFilter(filterId, enabled) {
  const { filters } = await loadLocalStorageOnlyFilters()
  const filterToToggle = filters.find(function (f) {
    return f.id === filterId
  })
  if (filterToToggle) {
    filterToToggle.enabled = enabled
  }
  return saveLocalStorage({
    filters,
  })
}
