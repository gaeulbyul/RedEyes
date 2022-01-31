
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
  return hostname
}

function wikipediaIdentifier(url: URLLike) {
  const path = decodeURI(url.pathname).toLowerCase()
  return 'wikipedia.org' + path
}

