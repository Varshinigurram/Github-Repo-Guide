import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackToTop() {
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    })
  }

  if (!visible) return null

  return (
    <Button
      type="button"
      onClick={scrollToTop}
      size="icon"
      aria-label="Back to top"
      title="Back to top of workspace"
      className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-opacity duration-200 cursor-pointer border border-primary/20"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
