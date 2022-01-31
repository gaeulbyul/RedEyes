
export function getIdentifier(url: string | URLLike): string | null {
  if (typeof url == 'string') {
    return getIdentifier(new URL(url))
  }
  const hostname = getHostname(url)
  const { pathname } = url
  switch (true) {
    case hostname == 'wikipedia.org':
    case hostname.endsWith('.wikipedia.org'):
      if (pathname.startsWith('/wiki/')) {
        return wikipediaIdentifier(url)
      }
      break
    case hostname == 'twitter.com':
    case hostname == 'mobile.twitter.com':
      return twitterIdentifier(url)
      break
    case hostname == 'facebook.com':
      return facebookIdentifier(url)
    default:
      return hostname
  }
  return null
}

function getHostname(url: URLLike) {
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
