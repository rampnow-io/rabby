"use client"

import { type RefObject, useEffect } from "react"
import useEvent from "./use-event"

interface IObject {
  down: boolean
  up: boolean
  freeze?: boolean
  modal?: boolean
  esc?: boolean
  click?: boolean
  onClose: (isEsc: boolean) => void | Promise<boolean>
}

let queue: IObject[] = []

async function closeObject(object: IObject, isEsc = false) {
  const result = await object.onClose(isEsc)
  if (result !== false) {
    queue = queue.filter((item) => item !== object)
  }
}

let eventListenersAdded = false

function addEventListeners() {
  document.addEventListener("mouseup", () => {
    if (
      queue.length > 0 &&
      !queue[queue.length - 1].down &&
      !queue[queue.length - 1].up &&
      queue[queue.length - 1].click
    ) {
      const object = queue[queue.length - 1]
      setTimeout(async () => {
        void closeObject(object)
      })
    }

    queue.forEach((object) => {
      object.freeze = object.modal || (object.down && object.up)
      object.down = false
      object.up = false
    })
  })

  document.body.addEventListener("keyup", (event) => {
    if (
      (event.key === "Escape" || event.key === "Esc") &&
      queue.length > 0 &&
      queue[queue.length - 1].esc
    ) {
      void closeObject(queue[queue.length - 1], true)
    }
  })
}

export default function useRootClose(
  ref: RefObject<HTMLElement> | RefObject<HTMLElement>[],
  onClose: (isEsc: boolean) => void,
  options?: {
    disabled?: boolean
    click?: boolean
    esc?: boolean
    modal?: boolean
  },
) {
  const persistentOnClose = useEvent(onClose)

  useEffect(() => {
    if (eventListenersAdded) {
      return
    }

    addEventListeners()
    eventListenersAdded = true
  }, [])

  useEffect(() => {
    if (options?.disabled) {
      return
    }

    const object = {
      down: false,
      up: false,
      freeze: Boolean(options?.modal),
      modal: Boolean(options?.modal),
      click: options?.click !== false,
      esc: options?.esc !== false,
      onClose: persistentOnClose,
    }

    while (queue.length > 0 && !queue[queue.length - 1].freeze) {
      queue.pop()?.onClose(false)
    }
    queue.forEach((object) => (object.freeze = object.modal))
    queue.push(object)

    let elements: (HTMLElement | null)[]
    const onMouseDown = () => {
      object.down = true
    }

    const onMouseUp = () => {
      object.up = true
    }

    setTimeout(() => {
      elements = Array.isArray(ref)
        ? ref.map(({ current }) => current)
        : [ref.current]

      elements?.forEach((element) =>
        element?.addEventListener("mousedown", onMouseDown),
      )
      elements?.forEach((element) =>
        element?.addEventListener("mouseup", onMouseUp),
      )
    })

    return () => {
      elements?.forEach((element) =>
        element?.removeEventListener("mousedown", onMouseDown),
      )
      elements?.forEach((element) =>
        element?.removeEventListener("mouseup", onMouseUp),
      )
      queue = queue.filter((item) => item !== object)
    }
  }, [options?.disabled])
}
