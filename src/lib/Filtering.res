@val external browser: 'browser = "browser"

type preparedBloomFilter = {
  id: string,
  name: string,
  group: SharedTypes.filterGroup,
  bloomFilter: BloomFilter.bfinstance,
}

let initializeFilter = (
  filter: SharedTypes.redEyesFilter,
  filterData: SharedTypes.redEyesFilterData,
) => {
  id: filter.id,
  name: filter.name,
  group: filter.group,
  bloomFilter: BloomFilter.createFromIntArray(filterData, 20),
}

let preparedBloomFilters = ref({
  open Promise
  open Js.Array2
  Storage.loadLocalStorage()->thenResolve(storage => {
    storage.filters
    ->filter(bf => bf.enabled)
    ->map(bf => {
      let maybeFilterData = Js.Dict.get(storage.filterDatas, bf.id)
      maybeFilterData->Belt.Option.flatMap(filterData => Some(initializeFilter(bf, filterData)))
    })
  })
})

let identify = identifier => {
  open Promise
  open Js.Array2
  preparedBloomFilters.contents->thenResolve(bloomFilters => {
    let matched: array<SharedTypes.redEyesFilter> = []
    bloomFilters->forEach(mbf => {
      switch (mbf) {
        | Some(bf) => {
            if BloomFilter.test(bf.bloomFilter, identifier) {
              matched->push({
                id: bf.id,
                enabled: true,
                name: bf.name,
                group: bf.group,
              })
              ->ignore
            }
          }
        | None => ()
      }
      ->ignore
    })
    matched
  })
}

let onFilterChanged = (filters: array<SharedTypes.redEyesFilter>, filterDatas: Js.Dict.t<SharedTypes.redEyesFilterData>) => {
  open Js.Array2
  preparedBloomFilters.contents = Promise.resolve(
    filters
    ->filter(bf => bf.enabled)
    ->map(bf => {
      let maybeFilterData = Js.Dict.get(filterDatas, bf.id)
      maybeFilterData->Belt.Option.flatMap(filterData => Some(initializeFilter(bf, filterData)))
    })
  )
}

browser["storage"]["onChanged"]["addListener"](.changes => {
  ignore(changes)
  let filtersInChanges = %raw("'filters'in changes && 'filterDatas'in changes")
  if filtersInChanges {
    let filters = %raw("changes.filters.newValue || []")
    let filterDatas = %raw("changes.filterDatas.newValue || {}")
    onFilterChanged(filters, filterDatas)
  }
})
