import { getAddedElementsFromMutations, collectElementsBySelector } from '../lib/common'
import * as Filtering from '../lib/filtering'
import { getIdentifier } from '../lib/identifier'
import { initColors /* toggleDarkMode */ } from './colors'
import { listenExtensionMessage } from './content-extension-message-handler'
import { indicateElement } from './indicator'

const cachedMatchResultsMap = new Map<string, MatchedFilter[]>()

async function handleLink(elem: HTMLAnchorElement) {
  const identifier = getIdentifier(elem)
  if (!identifier) {
    return
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

function isContentEditable(elem: HTMLElement): boolean {
  const { contentEditable } = elem
  if (!contentEditable) {
    return false
  }
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable
  const validValues = ['true', 'caret', 'events', 'plaintext-only', 'typing']
  if (validValues.includes(contentEditable)) {
    return true
  }
  return false
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
      // contentEditable 내부에선 무한루프 버그가 발생하는 듯.
      if (isContentEditable(elem)) {
        continue
      }
      const links = collectElementsBySelector<HTMLAnchorElement>(elem, selector)
      links.forEach(link => {
        if (touched.has(link)) {
          return
        }
        touched.add(link)
        const contentEditableElem = link.closest<HTMLElement>('[contenteditable]')
        if (contentEditableElem && isContentEditable(contentEditableElem)) {
          return
        }
        handleLink(link)
      })
    }
  })
  elemObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
}

main()
