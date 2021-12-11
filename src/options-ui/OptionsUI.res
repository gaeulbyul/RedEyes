@val external browser: 'browser = "browser"

external any: 'a => 'b = "%identity"

let s = React.string

module ReactTabs = {
  @react.component @module("react-tabs")
  external make: (~children: 'children) => React.element = "Tabs"
}
module ReactTab = {
  @react.component @module("react-tabs")
  external make: (~children: 'children) => React.element = "Tab"
}
module ReactTabList = {
  @react.component @module("react-tabs")
  external make: (~children: 'children) => React.element = "TabList"
}
module ReactTabPanel = {
  @react.component @module("react-tabs")
  external make: (~children: 'children) => React.element = "TabPanel"
}

module App = {
  @react.component
  let make = () => {
    <ReactTabs>
      <ReactTabList>
        <ReactTab> {s("Filters")} </ReactTab> <ReactTab> {s("Manual")} </ReactTab>
      </ReactTabList>
      <ReactTabPanel> <FiltersUI.FiltersUI /> </ReactTabPanel>
      <ReactTabPanel> <ManuallyIdentifiedUI.ManuallyIdentifiedUI /> </ReactTabPanel>
    </ReactTabs>
  }
}

let () = {
  switch ReactDOM.querySelector("#app") {
  | Some(root) => ReactDOM.render(<App />, root)
  | None => ()
  }
}

@val external document: 'document = "document"

document["addEventListener"]("DOMContentLoaded", () => {
  let manifest = browser["runtime"]["getManifest"](.)
  let name = manifest["name"]
  let version = %raw("manifest.version_name ?? manifest.version")
  let footer = document["getElementById"](. "footer")
  footer["textContent"] = `${name} v${version}`
})
