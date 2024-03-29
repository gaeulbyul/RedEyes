import * as Filtering from '../lib/filtering'
import { getHostname, getIdentifier } from '../lib/identifier'
import { loadLocalStorageOnly } from '../lib/storage'
import { initColors /* toggleDarkMode */ } from './colors'
import {
  collectElementsBySelector,
  getAddedElementsFromMutations,
  initIntersectionObserver,
  isContentEditable,
} from './content-common'
import { listenExtensionMessage } from './content-extension-message-handler'
import { indicateElement } from './indicator'

const cachedMatchResultsMap = new Map<string, MatchResult>()

const host = getHostname(location)

async function handleLink(elem: HTMLAnchorElement) {
  const identifier = getIdentifier(elem)
  if (!identifier) {
    return
  }

  if (identifier == host) {
    return
  }
  const cachedResults = cachedMatchResultsMap.get(identifier)
  if (cachedResults) {
    indicateElement(elem, identifier, cachedResults)
  } else {
    Filtering.identify(identifier).then(matchResult => {
      cachedMatchResultsMap.set(identifier, matchResult)
      indicateElement(elem, identifier, matchResult)
    })
  }
}

function main() {
  listenExtensionMessage()
  initColors()
  const selector = 'a[href]:not([href^="#"])'
  const touched = new WeakSet()
  const observer = initIntersectionObserver(handleLink)
  Array.from(document.querySelectorAll<HTMLAnchorElement>(selector))
    .filter(link => !touched.has(link))
    .forEach(link => {
      touched.add(link)
      observer.observe(link)
    })
  const elemObserver = new MutationObserver(mutations => {
    for (const elem of getAddedElementsFromMutations(mutations)) {
      // contentEditable 내부에선 무한루프 버그가 발생하는 듯.
      if (isContentEditable(elem)) {
        continue
      }
      const links = collectElementsBySelector<HTMLAnchorElement>(elem, selector)
      links
        .filter(link => !touched.has(link))
        .forEach(link => {
          touched.add(link)
          const contentEditableElem = link.closest<HTMLElement>('[contenteditable]')
          if (contentEditableElem && isContentEditable(contentEditableElem)) {
            return
          }
          observer.observe(link)
        })
    }
  })
  elemObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
}

loadLocalStorageOnly('excludedSites').then(
  ({ excludedSites }) => {
    const { hostname } = location
    if (excludedSites.includes(hostname)) {
      console.info('[RedEyes] this website (%s) is in the excluded sites.', hostname)
      return
    }
    main()
  },
  () => main()
)
