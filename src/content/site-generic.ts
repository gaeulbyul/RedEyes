import * as Filtering from '../lib/filtering'
import { initColors /* toggleDarkMode */} from './colors'
import { getAddedElementsFromMutations, collectElementsBySelector } from '../lib/common'
import { getIdentifier } from '../lib/identifier'
import { listenExtensionMessage } from './content-extension-message-handler'
import { indicateElement } from './indicator'

const cachedMatchResultsMap = new Map<string, MatchedFilter[]>()

async function handleLink(elem: HTMLAnchorElement) {
  const identifier = getIdentifier(elem)
  if (!identifier) {
    return
  }
  if (identifier.includes('/')) {
    console.log(identifier)
  }
  const cachedResults = cachedMatchResultsMap.get(identifier)
  if (cachedResults) {
    indicateElement(elem, identifier, cachedResults)
  } else {
    Filtering.identify(identifier).then(results => {
      cachedMatchResultsMap.set(identifier, results)
      indicateElement(elem, identifier, results)
    })
  }
}

function main() {
  listenExtensionMessage()
  initColors()
  const selector = 'a[href]:not([href^="#"])'
  const touched = new WeakSet()
  document.querySelectorAll<HTMLAnchorElement>(selector).forEach(link => {
    if (touched.has(link)) {
      return
    }
    touched.add(link)
    handleLink(link)
  })
  const elemObserver = new MutationObserver(mutations => {
    for (const elem of getAddedElementsFromMutations(mutations)) {
      if (touched.has(elem)) {
        return
      }
      touched.add(elem)
      const links = collectElementsBySelector<HTMLAnchorElement>(elem, selector)
      links.forEach(handleLink)
    }
  })
  elemObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
}

main()
