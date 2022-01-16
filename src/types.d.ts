// TODO: rename as harmful/friendly
type RedEyesFilterGroup = 'transphobic' | 'trans_friendly'

interface RedEyesFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
  enabled: boolean
}

interface RedEyesManuallyIdentifiedEntry {
  identifier: string
  group: string
}

type RedEyesFilterDatas = Record<string, number[]>

interface RedEyesStorage {
  filters: RedEyesFilter[]
  filterDatas: RedEyesFilterDatas
  manuallyIdentified: RedEyesManuallyIdentifiedEntry[]
}
