export function* getAddedElementsFromMutations(mutations: MutationRecord[]) {
  for (const mut of mutations) {
    for (const node of mut.addedNodes) {
      if (node instanceof HTMLElement) {
        yield node
      }
    }
  }
}
