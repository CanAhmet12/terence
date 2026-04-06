import { useEffect, useState } from 'react'

interface A11yConfig {
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'x-large'
  reducedMotion: boolean
  screenReaderMode: boolean
  keyboardNavigation: boolean
}

const DEFAULT_CONFIG: A11yConfig = {
  highContrast: false,
  fontSize: 'normal',
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
}

export function useAccessibility() {
  const [config, setConfig] = useState<A11yConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('a11y_config')
    if (saved) {
      setConfig(JSON.parse(saved))
    }

    // Detect system preferences
    detectSystemPreferences()
  }, [])

  useEffect(() => {
    // Apply configuration
    applyAccessibilityConfig(config)
    
    // Save to localStorage
    localStorage.setItem('a11y_config', JSON.stringify(config))
  }, [config])

  const detectSystemPreferences = () => {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches

    if (prefersReducedMotion || prefersHighContrast) {
      setConfig((prev) => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }))
    }
  }

  const applyAccessibilityConfig = (cfg: A11yConfig) => {
    const root = document.documentElement

    // High contrast
    if (cfg.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Font size
    root.classList.remove('text-normal', 'text-large', 'text-x-large')
    root.classList.add(`text-${cfg.fontSize}`)

    // Reduced motion
    if (cfg.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Screen reader mode
    if (cfg.screenReaderMode) {
      root.classList.add('screen-reader-mode')
    } else {
      root.classList.remove('screen-reader-mode')
    }
  }

  const toggleHighContrast = () => {
    setConfig((prev) => ({ ...prev, highContrast: !prev.highContrast }))
  }

  const setFontSize = (size: A11yConfig['fontSize']) => {
    setConfig((prev) => ({ ...prev, fontSize: size }))
  }

  const toggleReducedMotion = () => {
    setConfig((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }))
  }

  const toggleScreenReaderMode = () => {
    setConfig((prev) => ({ ...prev, screenReaderMode: !prev.screenReaderMode }))
  }

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG)
  }

  return {
    config,
    toggleHighContrast,
    setFontSize,
    toggleReducedMotion,
    toggleScreenReaderMode,
    resetToDefaults,
  }
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if user is typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Global keyboard shortcuts
      switch (e.key) {
        case '/':
          // Focus search
          e.preventDefault()
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
          break

        case 'Escape':
          // Close modals
          document.querySelector<HTMLButtonElement>('[data-close-modal]')?.click()
          break

        case '?':
          // Show keyboard shortcuts help
          e.preventDefault()
          showKeyboardShortcutsModal()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [enabled])
}

function showKeyboardShortcutsModal() {
  // Implement modal showing all shortcuts
  console.log('Keyboard shortcuts modal')
}

/**
 * Focus trap for modals (accessibility)
 */
export function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Focus first element
    firstElement?.focus()

    container.addEventListener('keydown', handleTab)
    return () => container.removeEventListener('keydown', handleTab)
  }, [isOpen, containerRef])
}

/**
 * Announce to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
