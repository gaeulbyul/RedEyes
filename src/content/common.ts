export function* getAddedElementsFromMutations(mutations: MutationRecord[]) {
  for (const mut of mutations) {
    for (const node of mut.addedNodes) {
      if (node instanceof HTMLElement) {
        yield node
      }
    }
  }
}

export function collectElementsBySelector<T extends HTMLElement = HTMLElement>(rootElem: HTMLElement, selector: string): T[] {
  const result: T[] = []
  if (rootElem.matches(selector)) {
    result.push(rootElem as T)
  }
  result.push(...rootElem.querySelectorAll<T>(selector))
  return result
}


export function maybeURL(url: string | URLLike): URL | null {
  try {
    return new URL(url.toString())
  } catch (err) {
    console.warn('failed to parse url "%s"', url, err)
    return null
  }
}
