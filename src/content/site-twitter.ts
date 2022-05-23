import * as Filtering from '../lib/filtering'
import { getIdentifier, twitterIdentifier } from '../lib/identifier'
import { loadLocalStorageOnly } from '../lib/storage'
import { initColors, toggleDarkMode } from './colors'
import {
  collectElementsBySelector,
  getAddedElementsFromMutations,
  initIntersectionObserver,
} from './content-common'
import { listenExtensionMessage } from './content-extension-message-handler'
import { indicateElement, removeIndicate } from './indicator'

function extractURL(elem: HTMLAnchorElement): URL | null {
  try {
    const hiddenPrefix = elem.childNodes[0].textContent!.trim()
    const visible = elem.childNodes[1].textContent!.trim()
    // suffix는 없을 수 있더라.
    let hiddenSuffix = ''
    const suffixNode = elem.childNodes[2]
    if (suffixNode) {
      hiddenSuffix = suffixNode.textContent!.trim()
    }
    return new URL(hiddenPrefix + visible + hiddenSuffix)
  } catch (err) {
    console.log('warning: failed to convert to url string', elem, err)
    return null
  }
}

async function handleExternalLink(elem: HTMLAnchorElement) {
  if (elem.matches('[data-testid^=card] a')) {
    // 트윗 카드의 경우 다른 방법으로 URL을 알아와야 한다.
    // content scripts상으론 어렵고, redux store를 통해야 할 듯.
    // 일단 이건 TODO
    return
  }
  const realUrl = extractURL(elem)
  if (!realUrl) {
    return
  }
  const identifier = getIdentifier(realUrl)
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(matchResult => {
    indicateElement(elem, identifier, matchResult)
  })
}

async function handleTypeaheadUserElem(elem: HTMLElement) {
  const userNameElem = elem.querySelector('[dir=ltr] > span')
  const userName = userNameElem!.textContent!.replace(/^@/, '')
  const identifier = `twitter.com/${userName.toLowerCase()}`
  Filtering.identify(identifier).then(matchResult => {
    indicateElement(elem, identifier, matchResult)
  })
}

async function handleUserCellElem(elem: HTMLElement) {
  if (elem.matches('[data-testid=typeaheadRecentSearchesItem] > [data-testid=UserCell]')) {
    return handleTypeaheadUserElem(elem)
  }
  const userLinkName = elem.querySelector<HTMLAnchorElement>('a[href^="/"] [dir=ltr] > span')!
  const userLink = userLinkName.closest('a[href^="/"]')
  const mentions = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  mentions.forEach(ln => {
    const identifier = twitterIdentifier(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(matchResult => {
      indicateElement(ln, identifier, matchResult)
      if (matchResult.filters.length > 0) {
        const isItself = ln.isSameNode(userLink)
        const isHarmful = matchResult.type === 'toxic'
        if (isItself && isHarmful) {
          elem.children[0].classList.add('assigned-label-transphobic')
        }
      }
    })
  })
  const externalLinkSelector = 'a[href^="https://t.co/"][rel~=noopener]'
  const externalLinks = elem.querySelectorAll<HTMLAnchorElement>(externalLinkSelector)
  externalLinks.forEach(handleExternalLink)
}

// 트위터에서 직접적인 멘션을 피하고자 @ 뒤에 공백이나 특수문자를 넣는 경우가 있다.
// 예를 들어, "@/example" , "@ example" 같은 식으로.
// 이런 계정도 표시하자.
async function handleTweetTextSpanElem(elem: HTMLElement) {
  const pattern = /@\W(\w{1,15})/gi
  const text = elem.textContent || ''
  const matches = Array.from(text.matchAll(pattern))
  const identifiers = matches.map(match => {
    const username = match[1]
    return 'twitter.com/' + username.toLowerCase()
  })
  const identifiedMatches = await Promise.all(
    identifiers.map(identifier => Filtering.identify(identifier))
  )
  const newText = document.createElement('span')
  elem.replaceWith(newText)
  let previousLastIndex = 0
  matches.forEach((match, i) => {
    const index = match.index!
    const lastIndex = index + match[0].length
    const identifier = identifiers[i]
    const identifyResult = identifiedMatches[i]
    const prefix = text.slice(previousLastIndex, index)
    newText.appendChild(document.createTextNode(prefix))
    const unlinkedMentionElement = document.createElement('span')
    // indicateElement 가 document.body.contains 체크를 하므로
    // appendChild 를 먼저 해줘야 한다.
    newText.appendChild(unlinkedMentionElement)
    unlinkedMentionElement.textContent = text.slice(index, lastIndex)
    indicateElement(unlinkedMentionElement, identifier, identifyResult)
    previousLastIndex = lastIndex
  })
  const lastPostfix = text.slice(previousLastIndex)
  if (lastPostfix) {
    newText.appendChild(document.createTextNode(lastPostfix))
  }
}

function handleTweetTextElem(elem: HTMLElement) {
  const spans = Array.from(elem.children).filter(el => el.tagName == 'SPAN') as HTMLElement[]
  spans.forEach(handleTweetTextSpanElem)
}

async function handleTweetElem(elem: HTMLElement) {
  const permalinkInTimeline = elem.querySelector('a[href*="/status/"] > time')?.parentElement
  const permalinkInTweetDetail = elem.querySelector('a[href*="/status/"] > span')?.parentElement
  const permalink = permalinkInTimeline || permalinkInTweetDetail
  if (!permalink) {
    console.warn('warning: permalink is missing. (maybe promotion-tweet?)')
    return
  }
  const userLinks = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  userLinks.forEach(ln => {
    const isAuthor = permalink && ln.isSameNode(permalink)
    const identifier = twitterIdentifier(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(matchResult => {
      indicateElement(ln, identifier, matchResult)
      if (matchResult.filters.length > 0) {
        const isHarmful = matchResult.type === 'toxic'
        if (isAuthor && isHarmful) {
          // article[data-testid=tweet] elem은 class가 바뀌면서
          // assigned-label-transphobic이 날라가더라.
          // 따라서 그 하위 요소 중에서 클래스네임을 부여한다.
          elem.children[0].classList.add('assigned-label-transphobic')
          // elem.classList.add('assigned-label-transphobic')
          elem.setAttribute('data-redeyes-tweet', matchResult.type)
        }
      }
    })
  })
  const externalLinkSelector = 'a[href^="https://t.co/"][rel~=noopener]'
  const externalLinks = elem.querySelectorAll<HTMLAnchorElement>(externalLinkSelector)
  externalLinks.forEach(handleExternalLink)
}

async function handleUserNameElem(elem: HTMLElement) {
  const actualUserNameElem = elem.querySelector('[dir=ltr] > span')!
  const userName = actualUserNameElem.textContent!.replace(/^@/, '')
  const identifier = 'twitter.com/' + userName.toLowerCase()
  Filtering.identify(identifier).then(matchResult => {
    indicateElement(elem, identifier, matchResult)
  })
}

async function handleUserDescriptionElem(elem: HTMLElement) {
  const mentions = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  mentions.forEach(ln => {
    const identifier = twitterIdentifier(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(matchResult => {
      indicateElement(ln, identifier, matchResult)
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
    const identifier = twitterIdentifier(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(matchResult => {
      indicateElement(ln, identifier, matchResult)
    })
  })
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

function handleElement(elem: HTMLElement) {
  const testid = elem.getAttribute('data-testid')!
  console.debug('testid %s', testid, elem)
  switch (testid) {
    case 'tweet':
      return handleTweetElem(elem)
    case 'UserCell':
      return handleUserCellElem(elem)
    case 'UserName':
      detectContentChange(elem)
      return handleUserNameElem(elem)
    case 'UserDescription':
      return handleUserDescriptionElem(elem)
    case 'TypeaheadUser':
      return handleTypeaheadUserElem(elem)
    case 'tweetText':
      return handleTweetTextElem(elem)
    default:
      console.warn('unknown element: ', elem)
      throw new Error('unreachable')
  }
}

function detectContentChange(elem: HTMLElement) {
  const mObserver = new MutationObserver(() => {
    removeIndicate(elem)
    handleElement(elem)
    console.debug('dCC! %o', elem)
  })
  mObserver.observe(elem, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href', 'src'],
  })
}

const selectors = [
  'article[data-testid=tweet]',
  'div[data-testid=UserCell]',
  'div[data-testid=UserName]',
  'div[data-testid=UserDescription]',
  'div[data-testid=TypeaheadUser]',
  'div[data-testid=tweetText]',
].join(',')

function main() {
  handleDarkMode()
  initColors()
  listenExtensionMessage()
  const observer = initIntersectionObserver(handleElement)
  const touched = new WeakSet()
  const elemObserver = new MutationObserver(mutations => {
    for (const elem of getAddedElementsFromMutations(mutations)) {
      if (touched.has(elem)) {
        continue
      }
      touched.add(elem)
      const elems = collectElementsBySelector(elem, selectors)
      elems.forEach(elem => observer.observe(elem))
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

loadLocalStorageOnly('excludedSites').then(
  ({ excludedSites }) => {
    const { hostname } = location
    if (excludedSites.includes(hostname)) {
      return
    }
    main()
  },
  () => main()
)
