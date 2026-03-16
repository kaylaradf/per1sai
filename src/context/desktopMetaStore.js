import { createContext, useContext } from 'react'

const DesktopMetaContext = createContext(null)

export function useDesktopMeta() {
  const context = useContext(DesktopMetaContext)

  if (!context) {
    throw new Error('useDesktopMeta must be used inside DesktopMetaProvider')
  }

  return context
}

export default DesktopMetaContext
