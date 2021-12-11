type filterGroup = [
  | #transphobic
  | #trans_friendly
]

type redEyesMatchedFilter = {
  name: string,
  group: filterGroup,
}

type redEyesFilter = {
  id: string,
  enabled: bool,
  name: string,
  group: filterGroup,
}

type redEyesFilterWithData = {
  id: string,
  enabled: bool,
  name: string,
  group: filterGroup,
  data: array<int>,
}

type identifyResult = {identifier: string, matchedFilters: array<redEyesFilter>}
