import * as Filtering from '../lib/filtering'
import { getAddedElementsFromMutations } from './common'
import { initColors, toggleDarkMode } from './colors'

const invalidUserNames = Object.freeze([
  'about',
  'account',
  'blog',
  'compose',
  'download',
  'explore',
  'followers',
  'followings',
  'hashtag',
  'home',
  'i',
  'intent',
  'lists',
  'login',
  'logout',
  'messages',
  'notifications',
  'oauth',
  'privacy',
  'search',
  'session',
  'settings',
  'share',
  'signup',
  'tos',
  'welcome',
])

function indicateElement(elem: HTMLElement, identifier: string, results: MatchedFilter[]) {
  if (results.length <= 0) {
    return
  }
  const matchedFilter = results[0]
  if (!matchedFilter) {
    return
  }
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
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.classList.add(className)
    span.setAttribute('data-redeyes', matchedFilter.group)
  })
}

async function handleUserCellElem(elem: HTMLElement) {
  const userLinkName = elem.querySelector<HTMLAnchorElement>('a[href^="/"] div[dir=ltr] > span')!
  const userLink = userLinkName.closest('a[href^="/"]')
  const mentions = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  mentions.forEach(ln => {
    const identifier = extractUserIdentifierFromLink(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
      if (results.length > 0) {
        const isItself = ln.isSameNode(userLink)
        const isHarmful = results[0].group === 'phobic'
        if (isItself && isHarmful) {
          elem.children[0].classList.add('assigned-label-transphobic')
        }
      }
    })
  })
}

async function handleTweetElem(elem: HTMLElement) {
  const permalink = elem.querySelector('a[href^="/"] > time')?.parentElement
  if (!permalink) {
    console.warn('warning: permalink is missing. (maybe promotion-tweet?)')
    return
  }
  const userLinks = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  userLinks.forEach(ln => {
    const isAuthor = ln.isSameNode(permalink)
    const identifier = extractUserIdentifierFromLink(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
      if (results.length > 0) {
        const isHarmful = results[0].group === 'phobic'
        if (isAuthor && isHarmful) {
          // article[data-testid=tweet] elem은 class가 바뀌면서
          // assigned-label-transphobic이 날라가더라.
          // 따라서 그 하위 요소 중에서 클래스네임을 부여한다.
          elem.children[0].classList.add('assigned-label-transphobic')
          // elem.classList.add('assigned-label-transphobic')
          elem.setAttribute('data-redeyes-tweet', results[0].group)
        }
      }
    })
  })
}

async function handleUserNameElem(elem: HTMLElement) {
  const actualUserNameElem = elem.querySelector('div[dir=ltr] > span')!
  const userName = actualUserNameElem.textContent!.replace(/^@/, '')
  const identifier = 'twitter.com/' + userName.toLowerCase()
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

async function handleUserDescriptionElem(elem: HTMLElement) {
  const mentions = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  mentions.forEach(ln => {
    const identifier = extractUserIdentifierFromLink(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
    })
  })
}

async function handleHoverLayer(elem: HTMLElement) {
  const mentions = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  mentions.forEach(ln => {
    const { pathname } = ln
    if (pathname.endsWith('/following') || pathname.endsWith('/followers')) {
      return
    }
    const identifier = extractUserIdentifierFromLink(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
    })
  })
}

function extractUserIdentifierFromLink(link: HTMLAnchorElement): string | null {
  const pattern = /^\/([0-9a-z_]{1,15})/i
  const maybeUserNameMatch = pattern.exec(link.pathname)
  if (!maybeUserNameMatch) {
    return null
  }
  const maybeUserName = maybeUserNameMatch[1]!
  if (invalidUserNames.includes(maybeUserName)) {
    return null
  }
  const loweredUserName = maybeUserName.toLowerCase()
  return `twitter.com/${loweredUserName}`
}

function isDark(colorThemeTag: HTMLMetaElement) {
  return colorThemeTag.content.toUpperCase() !== '#FFFFFF'
}

function handleDarkMode() {
  const colorThemeTag = document.querySelector<HTMLMetaElement>('meta[name=theme-color]')!
  const darkModeObserver = new MutationObserver(() => {
    toggleDarkMode(isDark(colorThemeTag))
  })
  darkModeObserver.observe(colorThemeTag, {
    attributeFilter: ['content'],
    attributes: true,
  })
  toggleDarkMode(isDark(colorThemeTag))
}

function collectElementsBySelector(rootElem: HTMLElement, selector: string): HTMLElement[] {
  const result: HTMLElement[] = []
  if (rootElem.matches(selector)) {
    result.push(rootElem)
  }
  result.push(...rootElem.querySelectorAll<HTMLElement>(selector))
  return result
}

function main() {
  handleDarkMode()
  initColors()
  const touched = new WeakSet()
  const elemObserver = new MutationObserver(mutations => {
    for (const elem of getAddedElementsFromMutations(mutations)) {
      if (touched.has(elem)) {
        return
      }
      touched.add(elem)
      const tweetElems = collectElementsBySelector(elem, 'article[data-testid=tweet]')
      tweetElems.forEach(handleTweetElem)
      // followers, followings, ...
      const userCellElems = collectElementsBySelector(elem, 'div[data-testid=UserCell]')
      userCellElems.forEach(handleUserCellElem)
      // username in profile
      const userNameElems = collectElementsBySelector(elem, 'div[data-testid=UserName')
      userNameElems.forEach(handleUserNameElem)
      const userDescriptionElems = collectElementsBySelector(elem, 'div[data-testid=UserDescription]')
      userDescriptionElems.forEach(handleUserDescriptionElem)
      const layers = document.getElementById('layers')
      if (layers) {
        handleHoverLayer(layers)
      }
    }
  })
  elemObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
}

main()
