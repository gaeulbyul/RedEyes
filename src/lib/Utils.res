let detachDataInFilter = (filter: SharedTypes.redEyesFilterWithData): SharedTypes.redEyesFilter => {
  id: filter.id,
  enabled: filter.enabled,
  name: filter.name,
  group: filter.group,
}
