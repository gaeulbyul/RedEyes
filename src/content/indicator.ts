const REDEYES_ATTR_NAME = 'data-redeyes'
const elemToIdentifierMap = new WeakMap<Element, string>()

function paintColorToElement(elem: HTMLElement, group: RedEyesFilterGroup | 'conflict') {
  removeIndicate(elem)
  elem.setAttribute(REDEYES_ATTR_NAME, group)
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.setAttribute(REDEYES_ATTR_NAME, group)
  })
}

function generateTooltip(identifier: string, matchResult: MatchResult): string {
  if (matchResult.isManuallyIdentified) {
    return `[RedEyes] You identified "${identifier}" as ${matchResult.type}.`
  }
  if (matchResult.type === 'neutral') {
    return ''
  }
  if (matchResult.type === 'conflict') {
    const { filters } = matchResult
    const filterNamesThatIdentifiedAsToxic = filters
      .filter(f => f.group === 'toxic')
      .map(f => f.name)
      .join()
    const filterNamesThatIdentifiedAsFriendly = filters
      .filter(f => f.group === 'friendly')
      .map(f => f.name)
      .join()
    return [
      `[RedEyes] Tried to identify "${identifier}" but conflicted...`,
      `This filter(s) identified it as Toxic: ${filterNamesThatIdentifiedAsToxic}`,
      `... but This filter(s) identified it as Friendly: ${filterNamesThatIdentifiedAsFriendly}`,
    ].join('\n')
  }
  const matchedFilterNames = matchResult.filters.map(f => f.name).join()
  return [
    `[RedEyes] Identified "${identifier}" as ${matchResult.type}!`,
    `Matched filters: ${matchedFilterNames}`,
  ].join('\n')
}

export function indicateElement(elem: HTMLElement, identifier: string, matchResult: MatchResult) {
  if (!document.body.contains(elem)) {
    return
  }
  elemToIdentifierMap.set(elem, identifier)
  document.addEventListener('REDEYES repaint', event => {
    const customEvent = event as CustomEvent
    const { identifier, group } = customEvent.detail
    if (!document.contains(elem)) {
      return
    }
    if (identifier != elemToIdentifierMap.get(elem)) {
      return
    }
    paintColorToElement(elem, group)
  })
  const tooltip = generateTooltip(identifier, matchResult)
  if (tooltip) {
    if (elem.title) {
      elem.title += '\n-----\n'
      elem.title += tooltip
    } else {
      elem.title = tooltip
    }
  }
  paintColorToElement(elem, matchResult.type)
}

export function repaintIdentifier(identifier: string, group: RedEyesFilterGroup) {
  document.dispatchEvent(
    new CustomEvent('REDEYES repaint', {
      detail: {
        identifier,
        group,
      },
    })
  )
}

function removeRedEyesAttribute(elem: HTMLElement) {
  elem.removeAttribute(REDEYES_ATTR_NAME)
}

export function removeIndicate(elem: HTMLElement) {
  if (!document.body.contains(elem)) {
    return
  }
  removeRedEyesAttribute(elem)
  const selector = `[${REDEYES_ATTR_NAME}]`
  elem.querySelectorAll<HTMLElement>(selector).forEach(removeRedEyesAttribute)
}
