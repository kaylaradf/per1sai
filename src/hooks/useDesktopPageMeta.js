import { useEffect } from 'react'
import { useDesktopMeta } from '../context/desktopMetaStore'

export default function useDesktopPageMeta(title, status) {
  const { setMeta } = useDesktopMeta()

  useEffect(() => {
    setMeta({ title, status })
  }, [setMeta, status, title])
}
