type RedEyesFilterGroup = 'toxic' | 'friendly' | 'neutral'

interface RedEyesFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
  enabled: boolean
}

type RedEyesFilterDatas = Record<string, number[]>

type RedEyesManuallyIdentifiedEntries = Record<string, RedEyesFilterGroup>

interface RedEyesColors {
  toxicLight: string
  toxicDark: string
  friendlyLight: string
  friendlyDark: string
}

interface RedEyesStorage {
  filters: RedEyesFilter[]
  filterDatas: RedEyesFilterDatas
  manuallyIdentified: RedEyesManuallyIdentifiedEntries
  colors: RedEyesColors
  excludedSites: string[]
}

type RedEyesStorageChanges = {
  [key in keyof RedEyesStorage]: {
    oldValue: RedEyesStorage[key]
    newValue: RedEyesStorage[key]
  }
}

interface MatchResult {
  type: RedEyesFilterGroup | 'conflict'
  isManuallyIdentified: boolean
  filters: MatchedFilter[]
}

interface MatchedFilter {
  id: string
  name: string
  group: RedEyesFilterGroup
}

type URLLike = URL | Location | HTMLAnchorElement

declare namespace REMessageToContent {
  interface Alert {
    messageTo: 'content'
    messageType: 'Alert'
    text: string
  }

  interface RepaintIdentifier {
    messageTo: 'content'
    messageType: 'RepaintIdentifier'
    identifier: string
    group: RedEyesFilterGroup
  }
}

type RedEyesMessageToContent = REMessageToContent.Alert | REMessageToContent.RepaintIdentifier
