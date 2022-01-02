type filterGroup = [
  | #transphobic
  | #trans_friendly
]

type redEyesFilter = {
  id: string,
  enabled: bool,
  name: string,
  group: filterGroup,
}

type redEyesFilterData = array<int>

type identifyResult = {identifier: string, matchedFilters: array<redEyesFilter>}
