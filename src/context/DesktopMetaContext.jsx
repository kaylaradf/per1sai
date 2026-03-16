import { useCallback, useMemo, useState } from 'react'
import DesktopMetaContext from './desktopMetaStore'

const defaultMeta = {
  title: 'University Archive',
  status: 'Dummy mode active',
}

export function DesktopMetaProvider({ children }) {
  const [meta, setMetaState] = useState(defaultMeta)

  const setMeta = useCallback((nextMeta) => {
    setMetaState((prevMeta) => {
      const mergedMeta = {
        ...prevMeta,
        ...nextMeta,
      }

      if (mergedMeta.title === prevMeta.title && mergedMeta.status === prevMeta.status) {
        return prevMeta
      }

      return mergedMeta
    })
  }, [])

  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta])

  return <DesktopMetaContext.Provider value={value}>{children}</DesktopMetaContext.Provider>
}
