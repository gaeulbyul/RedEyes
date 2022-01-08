import browser from 'webextension-polyfill'

import * as BloomFilter from './bloom-filter.js'
import * as RedEyesStorage from './storage.js'

function initializeFilter(filter, filterData) {
  return {
    id: filter.id,
    name: filter.name,
    group: filter.group,
    bloomFilter: BloomFilter.createFromIntArray(filterData, 20),
  }
}

let preparedBloomFilters = RedEyesStorage.loadLocalStorage().then(storage => {
  return prepare(storage.filters, storage.filterDatas)
})

function prepare(filters, filterDatas) {
  const result = []
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

export async function identify(identifier) {
  return preparedBloomFilters.then(bloomFilters => {
    const matched = []
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
  })
}

function onFilterChanged(filters, filterDatas) {
  const result = prepare(filters, filterDatas)
  preparedBloomFilters = Promise.resolve(result)
}

browser.storage.onChanged.addListener(function (changes) {
  const filtersInChanges = ('filters' in changes && 'filterDatas' in changes)
  if (!filtersInChanges) {
    return
  }
  const filters = (changes.filters.newValue || [])
  const filterDatas = (changes.filterDatas.newValue || {})
  return onFilterChanged(filters, filterDatas)
})
