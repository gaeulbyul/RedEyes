import { getAddedElementsFromMutations, collectElementsBySelector } from '../lib/common'
import * as Filtering from '../lib/filtering'
import { getIdentifier, twitterIdentifier } from '../lib/identifier'
import { initColors, toggleDarkMode } from './colors'
import { listenExtensionMessage } from './content-extension-message-handler'
import { indicateElement } from './indicator'

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
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

async function handleTypeaheadUserElem(elem: HTMLElement) {
  const userNameElem = elem.querySelector('[dir=ltr] > span')
  const userName = userNameElem!.textContent!.replace(/^@/, '')
  const identifier = `twitter.com/${userName.toLowerCase()}`
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
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
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
      if (results.length > 0) {
        const isItself = ln.isSameNode(userLink)
        const isHarmful = results[0].group === 'toxic'
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
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
      if (results.length > 0) {
        const isHarmful = results[0].group === 'toxic'
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
  const externalLinkSelector = 'a[href^="https://t.co/"][rel~=noopener]'
  const externalLinks = elem.querySelectorAll<HTMLAnchorElement>(externalLinkSelector)
  externalLinks.forEach(handleExternalLink)
}

async function handleUserNameElem(elem: HTMLElement) {
  const actualUserNameElem = elem.querySelector('[dir=ltr] > span')!
  const userName = actualUserNameElem.textContent!.replace(/^@/, '')
  const identifier = 'twitter.com/' + userName.toLowerCase()
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

async function handleUserDescriptionElem(elem: HTMLElement) {
  const mentions = elem.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
  mentions.forEach(ln => {
    const identifier = twitterIdentifier(ln)
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
    const identifier = twitterIdentifier(ln)
    if (!identifier) {
      return
    }
    Filtering.identify(identifier).then(results => {
      indicateElement(ln, identifier, results)
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

function main() {
  handleDarkMode()
  initColors()
  listenExtensionMessage()
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
      const userNameElems = collectElementsBySelector(elem, 'div[data-testid=UserName]')
      userNameElems.forEach(handleUserNameElem)
      const userDescriptionElems = collectElementsBySelector(elem, 'div[data-testid=UserDescription]')
      userDescriptionElems.forEach(handleUserDescriptionElem)
      const typeaheadUserElems = collectElementsBySelector(elem, 'div[data-testid=TypeaheadUser]')
      typeaheadUserElems.forEach(handleTypeaheadUserElem)
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
