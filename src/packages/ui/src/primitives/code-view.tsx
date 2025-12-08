"use client"

import JsonView from "@uiw/react-json-view"

interface Props {
  data: object
}

const style: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))",
  maxHeight: "50vh",
  minHeight: "50vh",
  overflowY: "auto",
}

function CodeView(props: Props) {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='col-span-2'>
        <div style={style}>
          <JsonView
            value={props.data}
            displayDataTypes={false}
            displayObjectSize={false}
            onCopied={(text, value) => {
              if (typeof value === "string") {
                setTimeout(() => {
                  navigator.clipboard.writeText(value)
                }, 50)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

CodeView.displayName = "CodeView"

export { CodeView }
