import * as Filtering from '../lib/filtering.js'
import { getAddedElementsFromMutations } from './common.js'

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
  } else if (matchedFilter.group == 'neutral') {
    className = 'redeyes-neutral'
    tooltip = 'this user is neither phobic nor friendly!'
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

async function handleUserLink(elem) {
  const userName = extractUserNameFromPath(elem.pathname || '')
  if (!validateUserName(userName)) {
    return
  }
  // "xxx, yyy님도 이 계정을 팔로우함"에서 xxx, yyy에 잘못 색칠될 수 있음
  if (elem.pathname.includes('/followers_you_follow')) {
    return
  }
  const identifier = `twitter.com/${userName}`
  const results = await Filtering.identify(identifier)
  if (results.length > 0) {
    indicateElement(elem, identifier, results)
  }
}

async function handleUserSpanElem(elem) {
  const userName = elem.textContent.trim().toLowerCase()
  if (!/^@[0-9A-Z_]{1,15}$/i.test(userName)) {
    return
  }
  const identifier = `twitter.com/${userName.slice(1)}`
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
    Array.from(getAddedElementsFromMutations(mutations)).forEach(elem => {
      if (touched.has(elem)) {
        return
      }
      touched.add(elem)
      {
        const links = []
        const selector = 'a[href^="/"]'
        if (elem.matches(selector)) {
          links.push(elem)
        }
        Array.from(elem.querySelectorAll(selector))
          .filter(n => !touched.has(n))
          .forEach(n => links.push(n))
        links.forEach(a => {
          touched.add(a)
          handleUserLink(a)
        })
      }
      {
        const nameElems = []
        const selector = 'div[dir=ltr]>span'
        if (elem.matches(selector)) {
          nameElems.push(elem)
        }
        Array.from(elem.querySelectorAll(selector))
          .filter(n => !touched.has(n))
          .forEach(n => nameElems.push(n))
        if (nameElems.length > 0) {
          //debugger
        }
        nameElems.forEach(el => {
          touched.add(el)
          handleUserSpanElem(el)
        })
      }
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

}


main()
