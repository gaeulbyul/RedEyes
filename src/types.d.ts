// TODO: rename as harmful/friendly
type RedEyesFilterGroup = 'phobic' | 'friendly' | 'neutral'

interface RedEyesFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
  enabled: boolean
}

type RedEyesFilterDatas = Record<string, number[]>

type RedEyesManuallyIdentifiedEntries = Record<string, RedEyesFilterGroup>

interface RedEyesColors {
  phobicLight: string
  phobicDark: string
  friendlyLight: string
  friendlyDark: string
}

interface RedEyesStorage {
  filters: RedEyesFilter[]
  filterDatas: RedEyesFilterDatas
  manuallyIdentified: RedEyesManuallyIdentifiedEntries
  colors: RedEyesColors
}

type RedEyesStorageChanges = {
  [key in keyof RedEyesStorage]: {
    oldValue: RedEyesStorage[key]
    newValue: RedEyesStorage[key]
  }
}

interface MatchedFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
}

type URLLike = URL | Location | HTMLAnchorElement
