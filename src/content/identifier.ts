export function wikipediaIdentifier(urlstr: string | URLLike) {
  const url = new URL(urlstr.toString())
  const path = decodeURI(url.pathname).toLowerCase()
  return 'wikipedia.org' + path
}
