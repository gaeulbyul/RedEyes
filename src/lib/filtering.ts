import browser from 'webextension-polyfill'

import * as BloomFilter from './bloom-filter'
import * as RedEyesStorage from './storage'

interface PreparedFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
  bloomFilter: BloomFilter.BloomFilter
}

function initializeFilter(filter: RedEyesFilter, filterData: number[]): PreparedFilter {
  return {
    id: filter.id,
    name: filter.name,
    group: filter.group,
    bloomFilter: BloomFilter.createFromIntArray(filterData, 20),
  }
}

const redEyesLocalStorage = RedEyesStorage.loadLocalStorage()

let preparedBloomFilters = redEyesLocalStorage.then(storage => {
  return refreshFilters(storage.filters, storage.filterDatas)
})

let preparedManuallyIdentifiedEntries = redEyesLocalStorage.then(storage => {
  return refreshManuallyIdentifiedEntries(storage.manuallyIdentified)
})

function refreshFilters(filters: RedEyesFilter[], filterDatas: RedEyesFilterDatas) {
  const result: PreparedFilter[] = []
  filters.forEach(filter => {
    if (!filter.enabled) {
      return
    }
    const filterData = filterDatas[filter.id]
    if (!filterData) {
      console.warn('data is missing for id "%s"', filter.id)
      return
    }
    result.push(initializeFilter(filter, filterData))
  })
  return result
}

function refreshManuallyIdentifiedEntries(manuallyIdentified: RedEyesManuallyIdentifiedEntry[]) {
  const result = Object.create(null)
  manuallyIdentified.forEach(entry => {
    result[entry.identifier] = entry.group
  })
  return result
}

export async function identify(identifier: string) {
  const miEntries = await preparedManuallyIdentifiedEntries
  if (identifier in miEntries) {
    const group = miEntries[identifier]
    return [{
      id: 'CUSTOM',
      name: 'CUSTOM',
      group,
    }]
  }
  const matched: MatchedFilter[] = []
  const bloomFilters = await preparedBloomFilters
  bloomFilters.forEach(mbf => {
    if (!mbf.bloomFilter.test(identifier)) {
      return
    }
    matched.push({
      id: mbf.id,
      name: mbf.name,
      group: mbf.group,
    })
  })
  return matched
}

browser.storage.onChanged.addListener(changes => {
  const filtersInChanges = ('filters' in changes || 'filterDatas' in changes)
  if (filtersInChanges) {
    const filters = (changes.filters.newValue || [])
    const filterDatas = (changes.filterDatas.newValue || {})
    const reprepared = refreshFilters(filters, filterDatas)
    preparedBloomFilters = Promise.resolve(reprepared)
  }
  if ('manuallyIdentified' in changes) {
    const manuallyIdentified = changes.manuallyIdentified.newValue || []
    const reprepared = refreshManuallyIdentifiedEntries(manuallyIdentified)
    preparedManuallyIdentifiedEntries = Promise.resolve(reprepared)
  }
})
