/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { JSX as ReactJSX } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': ReactJSX.IntrinsicElements['div'] & Record<string, unknown>
      'appkit-network-button': ReactJSX.IntrinsicElements['div'] & Record<string, unknown>
    }
  }
}
