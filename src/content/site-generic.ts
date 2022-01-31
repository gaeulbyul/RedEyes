import * as Filtering from '../lib/filtering'
import { getAddedElementsFromMutations, collectElementsBySelector } from './common'
import { initColors, /* toggleDarkMode */ } from './colors'
import { getIdentifier } from './identifier'

function indicateElement(elem: HTMLElement, identifier: string, results: MatchedFilter[]) {
  if (results.length <= 0) {
    return
  }
  const matchedFilter = results[0]!
  let className = ''
  let tooltip = ''
  if (matchedFilter.group == 'friendly') {
    className = 'redeyes-friendly'
    tooltip = 'this user is in the friendly!'
  } else if (matchedFilter.group == 'phobic') {
    className = 'redeyes-phobic'
    tooltip = 'this user is in the phobic!'
  } else if (matchedFilter.group == 'neutral') {
    className = 'redeyes-neutral'
    tooltip = 'this user is neither phobic nor friendly!'
  }
  tooltip += '\n' + JSON.stringify(
    {
      identifier,
      name: matchedFilter.name,
      group: matchedFilter.group,
    },
    null,
    2,
  )
  elem.classList.add(className)
  elem.title = tooltip
  elem.setAttribute('data-redeyes', matchedFilter.group)
}

async function handleLink(elem: HTMLAnchorElement) {
  const identifier = getIdentifier(elem)
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

function main() {
  const selector = 'a[href]:not([href^="#"])'
  initColors()
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
