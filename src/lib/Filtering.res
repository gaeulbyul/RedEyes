@val external browser: 'browser = "browser"

type preparedBloomFilter = {
  id: string,
  name: string,
  group: SharedTypes.filterGroup,
  bloomFilter: BloomFilter.bfinstance,
}

let initializeFilter = (filter: SharedTypes.redEyesFilterWithData) => {
  id: filter.id,
  name: filter.name,
  group: filter.group,
  bloomFilter: BloomFilter.createFromIntArray(filter.data, 20),
}

let preparedBloomFilters = ref({
  open Promise
  open Js.Array2
  Storage.loadLocalStorage()->thenResolve(storage => {
    storage.filters->map(initializeFilter)
  })
})

let identify = identifier => {
  open Promise
  open Js.Array2
  preparedBloomFilters.contents->thenResolve(bloomFilters => {
    let matched = bloomFilters->filter(bf => {
      BloomFilter.test(bf.bloomFilter, identifier)
    })
    matched->map((f): SharedTypes.redEyesMatchedFilter => {
      name: f.name,
      group: f.group,
    })
  })
}

let onFilterChanged = (filters: array<SharedTypes.redEyesFilterWithData>) => {
  open Js.Array2
  preparedBloomFilters.contents = Promise.resolve(
    filters->filter(bf => bf.enabled)->map(initializeFilter),
  )
}

browser["storage"]["onChanged"]["addListener"](.changes => {
  ignore(changes)
  let filtersInChanges = %raw("'filters'in changes")
  if filtersInChanges {
    let filters = %raw("changes.filters.newValue || []")
    onFilterChanged(filters)
  }
})
