import * as Filtering from '../lib/filtering'
import { getIdentifier } from '../lib/identifier'
import { loadLocalStorageOnly } from '../lib/storage'
import { initColors, toggleDarkMode } from './colors'
import { getAddedElementsFromMutations, collectElementsBySelector } from './content-common'
import { listenExtensionMessage } from './content-extension-message-handler'
import { indicateElement } from './indicator'

function isDark(htmlElement: HTMLHtmlElement, darkMedia: MediaQueryList) {
  const { colorMode, lightTheme, darkTheme } = htmlElement.dataset
  let currentTheme: string | undefined
  switch (colorMode) {
    case 'auto':
      currentTheme = darkMedia.matches ? darkTheme : lightTheme
      break
    case 'light':
      currentTheme = lightTheme
      break
    case 'dark':
      currentTheme = darkTheme
      break
  }
  if (!currentTheme) {
    return false
  }
  switch (true) {
    case currentTheme.startsWith('light'):
      return false
    case currentTheme.startsWith('dark'):
      return true
    default:
      console.debug('unknown color theme: "%s"', currentTheme)
      return false
  }
}

function userNameToIdentifier(name: string) {
  const userUrl = new URL(`/${name}`, 'https://github.com/')
  return getIdentifier(userUrl)
}

function getGitHubUserIdentifierFromLink(elem: HTMLAnchorElement) {
  // 커밋 목록에선 링크가 /user/repo/commits?author=actual-user 꼴로 되어있는데,
  // 그냥 처리하면 user 기준으로 판별되지만
  // 실제론 actual-user를 기준으로 판별해야 한다.
  if (elem.classList.contains('commit-author')) {
    const params = new URLSearchParams(elem.search)
    const author = params.get('author')
    if (author) {
      return userNameToIdentifier(author)
    }
  }
  return getIdentifier(elem.href)
}

async function handleUserLink(elem: HTMLAnchorElement) {
  const identifier = getGitHubUserIdentifierFromLink(elem)
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier!, results)
  })
}

// 이슈트래커 목록 (/user/repo/issues)에선 href가 이슈 항목을 가리키고 있기에
// handleUserLink를 하면 (이슈 작성자가 아닌) repo 주인의 색상을 따라가게 된다.
// 따라서 이를 별도로 처리하는 함수를 둔다.
async function handleHovercardUserLink(elem: HTMLAnchorElement) {
  const hovercardUrl = elem.getAttribute('data-hovercard-url')!
  const match = /^\/users\/([0-9A-Za-z_-]+)\/hovercard$/.exec(hovercardUrl)!
  const identifier = userNameToIdentifier(match[1])
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

async function handleHovercardRepoLink(elem: HTMLAnchorElement) {
  const hovercardUrl = elem.getAttribute('data-hovercard-url')!
  const userName = hovercardUrl.split('/')[1]
  const identifier = userNameToIdentifier(userName)
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

async function handleNotLinkedUserName(elem: HTMLElement) {
  const userName = elem.textContent!.trim()
  if (!userName) {
    return
  }
  const identifier = userNameToIdentifier(userName)
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

async function handleExternalLink(elem: HTMLAnchorElement) {
  if (elem.hostname === 'github.com') {
    return
  }
  const identifier = getIdentifier(elem.href)
  if (!identifier) {
    return
  }
  Filtering.identify(identifier).then(results => {
    indicateElement(elem, identifier, results)
  })
}

function handleDarkMode() {
  const htmlElement = document.querySelector('html')!
  const darkMedia = matchMedia('(prefers-color-scheme: dark)')
  function onChange() {
    toggleDarkMode(isDark(htmlElement, darkMedia))
  }
  darkMedia.onchange = onChange
  const themeAttributesObserver = new MutationObserver(onChange)
  themeAttributesObserver.observe(htmlElement, {
    attributes: true,
    attributeFilter: ['data-color-theme', 'data-light-theme', 'data-dark-theme'],
  })
  onChange()
}

function main() {
  handleDarkMode()
  initColors()
  listenExtensionMessage()
  const userLinkSelector = [
    'a.author',
    'span.author > a',
    'a.commit-author',
    'a.user-mention',
  ].join()
  const hovercardUserLinkSelector = 'a[data-hovercard-type=user]'
  const hovercardRepoLinkSelector = 'a[data-hovercard-type=repository]'
  const externalLinkSelector = 'a[href^="https:"], a[href^="http:"]'
  const userNameOnProfileSelector = 'span.p-nickname, div.user-profile-mini-vcard > span > strong'
  const touched = new WeakSet()
  collectElementsBySelector<HTMLAnchorElement>(document.body, userLinkSelector).forEach(
    handleUserLink
  )
  collectElementsBySelector<HTMLAnchorElement>(document.body, hovercardUserLinkSelector).forEach(
    handleHovercardUserLink
  )
  collectElementsBySelector<HTMLAnchorElement>(document.body, hovercardRepoLinkSelector).forEach(
    handleHovercardRepoLink
  )
  collectElementsBySelector(document.body, userNameOnProfileSelector).forEach(
    handleNotLinkedUserName
  )
  collectElementsBySelector<HTMLAnchorElement>(document.body, externalLinkSelector).forEach(
    handleExternalLink
  )
  const elemObserver = new MutationObserver(mutations => {
    for (const elem of getAddedElementsFromMutations(mutations)) {
      if (touched.has(elem)) {
        continue
      }
      touched.add(elem)
      collectElementsBySelector<HTMLAnchorElement>(elem, userLinkSelector).forEach(handleUserLink)
      collectElementsBySelector<HTMLAnchorElement>(elem, hovercardUserLinkSelector).forEach(
        handleHovercardUserLink
      )
      collectElementsBySelector<HTMLAnchorElement>(elem, hovercardRepoLinkSelector).forEach(
        handleHovercardRepoLink
      )
      collectElementsBySelector(elem, userNameOnProfileSelector).forEach(handleNotLinkedUserName)
      collectElementsBySelector<HTMLAnchorElement>(elem, externalLinkSelector).forEach(
        handleExternalLink
      )
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
