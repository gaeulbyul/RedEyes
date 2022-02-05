const DBG_tooltip = false

function paintColorToElement(elem: HTMLElement, group: RedEyesFilterGroup) {
  const className = groupToClassName(group)
  elem.classList.add(className)
  elem.setAttribute('data-redeyes', group)
  const spans = elem.querySelectorAll('span')
  spans.forEach(span => {
    span.classList.add(className)
    span.setAttribute('data-redeyes', group)
  })
}

function groupToClassName(group: RedEyesFilterGroup): string {
  switch (group) {
    case 'friendly':
      return 'redeyes-friendly'
    case 'phobic':
      return 'redeyes-phobic'
    case 'neutral':
      return 'redeyes-neutral'
  }
}

function generateTooltip(identifier: string, filter: MatchedFilter): string {
  let tooltip = '[RedEyes]:\n'
  tooltip += `identifier: "${identifier}"\n`
  tooltip += `name: "${filter.name}"\n`
  tooltip += `group: "${filter.group}"\n`
  return tooltip
}

export function indicateElement(elem: HTMLElement, identifier: string, filters: MatchedFilter[]) {
  if (filters.length <= 0) {
    return
  }
  const firstFilter = filters[0]!
  if (DBG_tooltip) {
    const tooltip = generateTooltip(identifier, firstFilter)
    elem.title = tooltip
  }
  paintColorToElement(elem, firstFilter.group)
}