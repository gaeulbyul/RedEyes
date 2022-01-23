// TODO: rename as harmful/friendly
type RedEyesFilterGroup = 'transphobic' | 'trans_friendly' | 'neutral'

interface RedEyesFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
  enabled: boolean
}


type RedEyesFilterDatas = Record<string, number[]>

type RedEyesManuallyIdentifiedEntries = Record<string, RedEyesFilterGroup>

interface RedEyesStorage {
  filters: RedEyesFilter[]
  filterDatas: RedEyesFilterDatas
  manuallyIdentified: RedEyesManuallyIdentifiedEntries
}

interface MatchedFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
}
