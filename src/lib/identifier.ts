export function getIdentifier(url: string | URLLike): string | null {
  if (typeof url == 'string') {
    return getIdentifier(new URL(url))
  }
  const hostname = getHostname(url)
  const { pathname } = url
  // 유튜브에서 동영상 설명 내 링크는 실제 URL 대신 youtube.com/redirect가 걸려있더라.
  if (hostname == 'youtube.com' && pathname == '/redirect') {
    const realURL = getRealURLFromYoutubeRedirect(url)
    return getIdentifier(realURL)
  }
  switch (true) {
    case hostname == 'wikipedia.org':
    case hostname.endsWith('.wikipedia.org'):
    // Shinigami-Eyes에선 rationalwiki의 항목도 wikipedia.org의 항목처럼 취급하더라.
    case hostname == 'rationalwiki.org':
      if (pathname.startsWith('/wiki/')) {
        return wikipediaIdentifier(url)
      }
      break
    case hostname == 'twitter.com':
    case hostname == 'mobile.twitter.com':
      return twitterIdentifier(url)
    case hostname == 'facebook.com':
      return facebookIdentifier(url)
    case hostname == 'reddit.com':
    case hostname.endsWith('.reddit.com'):
      return redditIdentifier(url)
    case hostname == 'medium.com':
      return mediumIdentifier(url)
    case hostname == 'youtube.com':
      return youtubeIdentifier(url)
    case hostname == 'github.com':
      return githubIdentifier(url)
    default:
      return hostname
  }
  return null
}

export function getHostname(url: URLLike) {
  let { hostname } = url
  // hostname 끝에 마침표가 올 수도 있음
  // ex. https://en.wikipedia.org./wiki/Foobar
  if (hostname.endsWith('.')) {
    hostname = hostname.replace(/\.$/, '')
  }
  if (hostname.startsWith('www.')) {
    hostname = hostname.replace(/^www\./i, '')
  }
  return hostname
}

function getRealURLFromYoutubeRedirect(urllike: URLLike): URL {
  const url = new URL(urllike.href)
  const qValue = url.searchParams.get('q')!
  const result = new URL(qValue)
  if (result.hostname.endsWith('youtube.com') && result.pathname == '/redirect') {
    throw new Error('???')
  }
  return result
}

function wikipediaIdentifier(url: URLLike) {
  const path = decodeURI(url.pathname).toLowerCase()
  return 'wikipedia.org' + path
}

const invalidUserNamesInTwitter = Object.freeze([
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

export function twitterIdentifier(url: URLLike): string | null {
  const pattern = /^\/([0-9a-z_]{1,15})/i
  const maybeUserNameMatch = pattern.exec(url.pathname)
  if (!maybeUserNameMatch) {
    return null
  }
  const maybeUserName = maybeUserNameMatch[1]!
  if (invalidUserNamesInTwitter.includes(maybeUserName)) {
    return null
  }
  const loweredUserName = maybeUserName.toLowerCase()
  return `twitter.com/${loweredUserName}`
}

function facebookIdentifier(url: URLLike): string | null {
  // pattern 참고: https://www.facebook.com/help/105399436216001
  const pattern = /^\/([0-9a-z.]+)\b/i
  const maybeUserNameMatch = pattern.exec(url.pathname)
  if (!maybeUserNameMatch) {
    return null
  }
  const maybeUserName = maybeUserNameMatch[1]!
  const loweredUserName = maybeUserName.toLowerCase()
  return `facebook.com/${loweredUserName}`
}

function redditIdentifier(url: URLLike): string | null {
  const pattern = /^\/(r|user)\/([0-9A-Za-z_]{1,20})/
  const maybePatternMatch = pattern.exec(url.pathname)
  if (!maybePatternMatch) {
    return null
  }
  const identifierType = maybePatternMatch[1]!
  const identifierId = maybePatternMatch[2]!
  const loweredId = identifierId.toLowerCase()
  return `reddit.com/${identifierType}/${loweredId}`
}

function mediumIdentifier(url: URLLike): string | null {
  const firstToken = url.pathname.split('/')[1]!
  if (!firstToken) {
    return null
  }
  const loweredToken = firstToken.toLowerCase()
  return `medium.com/${loweredToken}`
}

function youtubeIdentifier(url: URLLike): string | null {
  const pattern = /^\/(c|channel|user)\/([0-9A-Za-z_-]+)/
  const matched = pattern.exec(url.pathname)
  if (!matched) {
    return null
  }
  const identifierType = matched[1]!
  const identifierId = matched[2]!
  const loweredId = identifierId.toLowerCase()
  return `youtube.com/${identifierType}/${loweredId}`
}

function githubIdentifier(url: URLLike): string | null {
  const firstToken = url.pathname.split('/')[1]!
  if (!firstToken) {
    return null
  }
  const loweredToken = firstToken.toLowerCase()
  return `github.com/${loweredToken}`
}
