import * as Filtering from '../lib/filtering.js'

const name2IdMap = new Map

function indicateElement(elem, identifier, results) {
  const matchedFilter = results[0]
  if (!matchedFilter) {
    return
  }
  matchedFilter.identifier = identifier
  delete matchedFilter.id
  let className = ''
  let tooltip = ''
  if (matchedFilter.group == 'trans_friendly') {
    className = 'redeyes-trans-friendly'
    tooltip = 'this user is in the transfriendly!'
  } else if (matchedFilter.group == 'transphobic') {
    className = 'redeyes-transphobic'
    tooltip = 'this user is in the transphobic!'
  }
  tooltip += '\n' + JSON.stringify(matchedFilter, null, 2)
  elem.classList.add(className)
  elem.title = tooltip
  elem.setAttribute('data-redeyes', matchedFilter.group)
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.classList.add(className)
    span.setAttribute('data-redeyes', matchedFilter.group)
  })
}

function extractUserNameFromPath(path) {
  const splitted = path.split('/').slice(1)
  if (splitted.length <= 0) {
    return null
  }
  const name = splitted[0].toLowerCase()
  if (invalidUserNames.includes(name)) {
    return null
  }
  return name
}

async function handleUserElem(elem) {
  const userName = extractUserNameFromPath(elem.pathname || '')
  if (!validateUserName(userName)) {
    return
  }
  // "xxx, yyy님도 이 계정을 팔로우함"에서 xxx, yyy에 잘못 색칠될 수 있음
  if (elem.pathname.includes('/followers_you_follow')) {
    return
  }
  if (name2IdMap.has(userName)) {
    const userId = name2IdMap.get(userName)
    const userIdIdentifier = `twitter.com?USERID=${userId}`
    console.info('idid: "%s"', userIdIdentifier)
    // Filtering.identify(userIdIdentifier)
  }
  const identifier = `twitter.com/${userName}`
  const results = await Filtering.identify(identifier)
  if (results.length > 0) {
    indicateElement(elem, identifier, results)
  }
}

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

function validateUserName(userName) {
  if (typeof userName != 'string') {
    return false
  }
  const userNamePattern = /^[0-9a-z_]{1,15}$/i
  if (!userNamePattern.test(userName)) {
    return false
  }
  if (invalidUserNames.includes(userName)) {
    return false
  }
  return true
}

function isDark(colorThemeTag) {
  return colorThemeTag.content.toUpperCase() !== '#FFFFFF'
}

function main() {
  const touched = new WeakSet()
  const userNameObserver = new MutationObserver(mutations => {
    mutations.forEach(({ addedNodes }) => {
      addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) {
          return
        }
        if (touched.has(node)) {
          return
        }
        touched.add(node)
        const links = []
        const selector = 'a[href^="/"]'
        if (node.matches(selector)) {
          links.push(node)
        }
        Array.from(node.querySelectorAll(selector))
          .filter(n => !touched.has(n))
          .forEach(n => links.push(n))
        links.forEach(a => {
          touched.add(a)
          handleUserElem(a)
        })
      })
    })
  })
  userNameObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
  const colorThemeTag = document.querySelector('meta[name=theme-color]')
  const darkModeObserver = new MutationObserver(() => {
    document.body.classList.toggle('darkmode', isDark(colorThemeTag))
  })
  darkModeObserver.observe(colorThemeTag, {
    attributeFilter: ['content'],
    attributes: true,
  })
  document.body.classList.toggle('darkmode', isDark(colorThemeTag))
  document.body.appendChild(document.createElement('script'))
  // 현재 갖춰놓은 필터가 없으므로 일단 주석처리.
  // injectScript('/bundled/inject_twitter.bun.js')
  // listenUserIdGathererEvent()
}

function injectScript(path) {
  const script = document.createElement('script')
  script.src = browser.runtime.getURL(path)
  script.onload = script.onerror = () => {
    script.remove()
  }
  document.body.appendChild(script)
}

function listenUserIdGathererEvent() {
  document.body.addEventListener('RedEyes<-UserIds', event => {
    if (!(event instanceof CustomEvent)) {
      throw new Error('unreachable')
    }
    const users = event.detail
    Object.entries(users).forEach(([name, id]) => {
      name2IdMap.set(name, id)
    })
  })
}

main()
