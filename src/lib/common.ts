
export function maybeURL(url: string | URLLike): URL | null {
  try {
    return new URL(url.toString())
  } catch (err) {
    console.warn('failed to parse url "%s"', url, err)
    return null
  }
}
