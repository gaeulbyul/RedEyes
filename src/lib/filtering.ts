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
  if (result.length <= 0) {
    console.warn('[RedEyes] warning: no filter installed')
  }
  return result
}

function refreshManuallyIdentifiedEntries(manuallyIdentified: RedEyesManuallyIdentifiedEntries) {
  const result = Object.assign(Object.create(null), manuallyIdentified)
  return result
}

export async function identify(identifier: string): Promise<MatchResult> {
  const miEntries = await preparedManuallyIdentifiedEntries
  if (identifier in miEntries) {
    const group = miEntries[identifier]
    return {
      type: group,
      isManuallyIdentified: true,
      filters: [],
    }
  }
  const matched: MatchedFilter[] = []
  let toxic = false
  let friendly = false
  const bloomFilters = await preparedBloomFilters
  for (const mbf of bloomFilters) {
    if (!mbf.bloomFilter.test(identifier)) {
      continue
    }
    switch (mbf.group) {
      case 'toxic':
        toxic = true
        break
      case 'friendly':
        friendly = true
        break
    }
    matched.push({
      id: mbf.id,
      name: mbf.name,
      group: mbf.group,
    })
  }
  // 여러 필터가 설치되어있는데, 상반된 결과를 나타내면 conflict로 하자.
  let matchType: MatchResult['type']
  switch (true) {
    case toxic && !friendly:
      matchType = 'toxic'
      break
    case !toxic && friendly:
      matchType = 'friendly'
      break
    case toxic && friendly:
      matchType = 'conflict'
      break
    case !toxic && !friendly:
      matchType = 'neutral'
      break
    default:
      throw new Error('unreachable')
  }
  return {
    type: matchType,
    isManuallyIdentified: false,
    filters: matched,
  }
}

browser.storage.onChanged.addListener(changes => {
  const filtersInChanges = 'filters' in changes || 'filterDatas' in changes
  if (filtersInChanges) {
    const filters = changes.filters.newValue || []
    const filterDatas = changes.filterDatas.newValue || {}
    const reprepared = refreshFilters(filters, filterDatas)
    preparedBloomFilters = Promise.resolve(reprepared)
  }
  if ('manuallyIdentified' in changes) {
    const manuallyIdentified = changes.manuallyIdentified.newValue || []
    const reprepared = refreshManuallyIdentifiedEntries(manuallyIdentified)
    preparedManuallyIdentifiedEntries = Promise.resolve(reprepared)
  }
})
