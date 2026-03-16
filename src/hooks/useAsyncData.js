import { useEffect, useEffectEvent, useState } from 'react'

export default function useAsyncData(loader, key, initialValue) {
  const runLoader = useEffectEvent(loader)
  const [state, setState] = useState(() => ({
    data: initialValue,
    error: null,
    loading: true,
  }))

  useEffect(() => {
    let cancelled = false

    setState((current) => ({
      data: current.data,
      error: null,
      loading: true,
    }))

    async function load() {
      try {
        const data = await runLoader()

        if (!cancelled) {
          setState({
            data,
            error: null,
            loading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            data: current.data,
            error,
            loading: false,
          }))
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [key])

  return state
}
