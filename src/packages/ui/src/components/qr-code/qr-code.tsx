"use client"

import QRCodeStyling, { type Options } from "qr-code-styling"
import React, { useEffect, useRef, useState } from "react"

export interface QrCodeProps {
  data: string
  size?: number
  icon?: string
}

export const QrCode: React.FC<QrCodeProps> = ({ data, size = 200, icon }) => {
  const options: Options = {
    width: size,
    height: size,
    type: "svg",
    data,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.2,
    },
    image: icon,
    dotsOptions: {
      type: "dots",
      color: "#050505",
      roundSize: true,
    },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
    cornersDotOptions: { type: "square", color: "#000000" },
  }
  const ref = useRef(null)
  const [qrCode] = useState(new QRCodeStyling(options))

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current)
    }
  }, [ref])

  return <div ref={ref} />
}
