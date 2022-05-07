export function* getAddedElementsFromMutations(mutations: MutationRecord[]) {
  for (const mut of mutations) {
    for (const node of mut.addedNodes) {
      if (node instanceof HTMLElement) {
        yield node
      }
    }
  }
}

export function collectElementsBySelector<T extends HTMLElement = HTMLElement>(
  rootElem: HTMLElement,
  selector: string
): T[] {
  const result: T[] = []
  if (rootElem.matches(selector)) {
    result.push(rootElem as T)
  }
  result.push(...rootElem.querySelectorAll<T>(selector))
  return result
}

export function isContentEditable(elem: HTMLElement): boolean {
  const { contentEditable } = elem
  if (!contentEditable) {
    return false
  }
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable
  const validValues = ['true', 'caret', 'events', 'plaintext-only', 'typing']
  if (validValues.includes(contentEditable)) {
    return true
  }
  return false
}

export function initIntersectionObserver<T extends HTMLElement>(callback: (elem: T) => void) {
  const observer = new IntersectionObserver((entries, oer) => {
    entries
      .filter(({ isIntersecting }) => isIntersecting)
      .forEach(entry => {
        const elem = entry.target as T
        callback(elem)
        oer.unobserve(elem)
      })
  })
  return observer
}
