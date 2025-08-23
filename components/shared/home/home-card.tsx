'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CardItem = {
  title: string
  link: { text: string; href: string }
  items: {
    name: string
    items?: string[]
    image: string
    href: string
    className?: string
  }[]
}

export function HomeCard({ cards }: { cards: CardItem[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile or desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Consider lg breakpoint (1024px) as desktop
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate total number of cards
  const totalCards = cards.length

  // Handle manual navigation with precise single-card scroll (mobile only)
  const scrollPrev = () => {
    if (!scrollContainerRef.current || !isMobile) return

    const newIndex = Math.max(0, currentCardIndex - 1)
    setCurrentCardIndex(newIndex)

    // Calculate the exact position to scroll to
    const cardElements =
      scrollContainerRef.current.querySelectorAll('.card-item')
    if (cardElements[newIndex]) {
      scrollContainerRef.current.scrollLeft =
        cardElements[newIndex].getBoundingClientRect().left +
        scrollContainerRef.current.scrollLeft -
        scrollContainerRef.current.getBoundingClientRect().left
    }
  }

  const scrollNext = () => {
    if (!scrollContainerRef.current || !isMobile) return

    const newIndex = Math.min(totalCards - 1, currentCardIndex + 1)
    setCurrentCardIndex(newIndex)

    // Calculate the exact position to scroll to
    const cardElements =
      scrollContainerRef.current.querySelectorAll('.card-item')
    if (cardElements[newIndex]) {
      scrollContainerRef.current.scrollLeft =
        cardElements[newIndex].getBoundingClientRect().left +
        scrollContainerRef.current.scrollLeft -
        scrollContainerRef.current.getBoundingClientRect().left
    }
  }

  // Auto-scroll functionality - only for mobile
  useEffect(() => {
    if (!isMobile) {
      // Make sure to clear any autoScroll if we switch to desktop
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
      return
    }

    const startAutoScroll = () => {
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const newIndex = (currentCardIndex + 1) % totalCards
          setCurrentCardIndex(newIndex)

          // Scroll to the exact card
          const cardElements =
            scrollContainerRef.current.querySelectorAll('.card-item')
          if (cardElements[newIndex]) {
            scrollContainerRef.current.scrollTo({
              left:
                cardElements[newIndex].getBoundingClientRect().left +
                scrollContainerRef.current.scrollLeft -
                scrollContainerRef.current.getBoundingClientRect().left,
              behavior: 'smooth',
            })
          }
        }
      }, 3000)
    }

    startAutoScroll()

    // Cleanup interval on unmount
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [currentCardIndex, totalCards, isMobile])

  // Handle manual scroll - only for mobile
  const handleManualScroll = () => {
    if (!isMobile) return

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
    }

    // Find the closest card to the current scroll position
    if (scrollContainerRef.current) {
      const containerLeft =
        scrollContainerRef.current.getBoundingClientRect().left
      const cardElements =
        scrollContainerRef.current.querySelectorAll('.card-item')

      let closestIndex = 0
      let minDistance = Infinity

      cardElements.forEach((card, index) => {
        const cardLeft = card.getBoundingClientRect().left
        const distance = Math.abs(cardLeft - containerLeft)
        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      })

      setCurrentCardIndex(closestIndex)
    }

    // Restart auto-scroll after a pause
    setTimeout(() => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          const newIndex = (currentCardIndex + 1) % totalCards
          setCurrentCardIndex(newIndex)

          const cardElements =
            scrollContainerRef.current.querySelectorAll('.card-item')
          if (cardElements[newIndex]) {
            scrollContainerRef.current.scrollTo({
              left:
                cardElements[newIndex].getBoundingClientRect().left +
                scrollContainerRef.current.scrollLeft -
                scrollContainerRef.current.getBoundingClientRect().left,
              behavior: 'smooth',
            })
          }
        }
      }, 3000)
    }, 5000)
  }

  // Process items to ensure we only show 4 per card
  const processedCards = cards.map((card) => {
    const limitedItems = card.items.slice(0, 4)
    return { ...card, items: limitedItems }
  })

  // Render different layouts for mobile and desktop
  if (!isMobile) {
    // Desktop layout - grid with 100% width and larger cards
    return (
      <div className='w-full grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6'>
        {processedCards.map((card) => (
          <Card
            key={card.title}
            className='rounded-lg shadow-md hover:shadow-xl transition-all duration-500 flex flex-col border-2 border-border/30 hover:border-primary/40 dark:border-zinc-700 dark:hover:border-primary/60 dark:bg-zinc-900 dark:hover:bg-zinc-900'
          >
            <CardContent className='p-4 sm:p-5 md:p-7 flex-1'>
              <h3 className='text-lg sm:text-xl font-bold mb-4 sm:mb-6 border-b pb-3 sm:pb-4 text-foreground dark:text-foreground/90'>
                {card.title}
              </h3>

              <div className='grid grid-cols-2 gap-4 sm:gap-6'>
                {card.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn('flex flex-col group', item.className)}
                  >
                    <div className='bg-secondary/40 dark:bg-zinc-800 rounded-lg p-3 sm:p-4 flex items-center justify-center mb-2 sm:mb-3 overflow-hidden relative border border-border/50 dark:border-zinc-700 hover:border-primary/50 dark:hover:border-primary/60 transition-colors duration-300'>
                      <div className='absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                      <div className='transform transition-transform duration-500 ease-out group-hover:translate-y-[-4px] sm:group-hover:translate-y-[-6px] relative z-10'>
                        <Image
                          src={item.image}
                          alt={item.name}
                          className='aspect-square object-contain max-w-full h-auto mx-auto group-hover:scale-110 transition-transform duration-700 drop-shadow-sm'
                          height={100}
                          width={100}
                        />
                      </div>
                    </div>
                    <p className='text-center text-sm sm:text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-primary transition-colors duration-300 dark:font-semibold'>
                      {item.name}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>

            {card.link && (
              <CardFooter className='border-t pt-3 pb-4 px-4 sm:pt-4 sm:pb-5 sm:px-7'>
                <Link
                  href={card.link.href}
                  className='text-sm sm:text-base font-semibold text-primary hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-primary transition-colors duration-300 flex items-center group hover-arrow-animation'
                >
                  {card.link.text}
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='ml-1 h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-300'
                  >
                    <path d='m9 18 6-6-6-6' />
                  </svg>
                </Link>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    )
  }

  // Mobile layout - scrollable with navigation and dots
  return (
    <div className='relative'>
      {/* Navigation buttons - mobile only */}
      <Button
        variant='outline'
        size='icon'
        className='absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 w-7 h-7 sm:w-8 sm:h-8'
        onClick={scrollPrev}
        aria-label='Previous card'
        disabled={currentCardIndex === 0}
      >
        <ChevronLeftIcon className='h-3 w-3 sm:h-4 sm:w-4' />
      </Button>

      <Button
        variant='outline'
        size='icon'
        className='absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 w-7 h-7 sm:w-8 sm:h-8'
        onClick={scrollNext}
        aria-label='Next card'
        disabled={currentCardIndex === totalCards - 1}
      >
        <ChevronRightIcon className='h-3 w-3 sm:h-4 sm:w-4' />
      </Button>

      {/* Card container with scroll snapping - mobile only */}
      <div
        className='overflow-x-auto pb-4 scrollbar-hide px-6 scroll-smooth snap-x snap-mandatory'
        ref={scrollContainerRef}
        onScroll={handleManualScroll}
        onMouseEnter={() => {
          if (autoScrollIntervalRef.current)
            clearInterval(autoScrollIntervalRef.current)
        }}
        onMouseLeave={() => {
          handleManualScroll()
        }}
      >
        <div className='flex gap-4 min-w-max'>
          {processedCards.map((card, index) => (
            <Card
              key={card.title}
              className={`card-item rounded-lg shadow-md hover:shadow-xl transition-all duration-500 flex flex-col border-2 border-border/30 hover:border-primary/40 dark:border-zinc-700 dark:hover:border-primary/60 dark:bg-zinc-900 dark:hover:bg-zinc-900 w-[85vw] max-w-[350px] sm:w-[340px] flex-shrink-0 snap-center`}
              data-index={index}
            >
              <CardContent className='p-3 sm:p-4 md:p-6 flex-1'>
                <h3 className='text-base sm:text-lg font-bold mb-3 sm:mb-5 border-b pb-2 sm:pb-3 text-foreground dark:text-foreground/90'>
                  {card.title}
                </h3>

                <div className='grid grid-cols-2 gap-3 sm:gap-4'>
                  {card.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn('flex flex-col group', item.className)}
                    >
                      <div className='bg-secondary/40 dark:bg-zinc-800 rounded-lg p-2 sm:p-3 flex items-center justify-center mb-1 sm:mb-2 overflow-hidden relative border border-border/50 dark:border-zinc-700 hover:border-primary/50 dark:hover:border-primary/60 transition-colors duration-300'>
                        <div className='absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                        <div className='transform transition-transform duration-500 ease-out group-hover:translate-y-[-2px] sm:group-hover:translate-y-[-5px] relative z-10'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            className='aspect-square object-contain max-w-full h-auto mx-auto group-hover:scale-110 transition-transform duration-700 drop-shadow-sm'
                            height={80}
                            width={80}
                          />
                        </div>
                      </div>
                      <p className='text-center text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-primary transition-colors duration-300 dark:font-semibold'>
                        {item.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>

              {card.link && (
                <CardFooter className='border-t pt-2 pb-3 px-3 sm:pt-3 sm:pb-4 sm:px-6'>
                  <Link
                    href={card.link.href}
                    className='text-xs sm:text-sm font-semibold text-primary hover:text-emerald-500 dark:text-emerald-300 dark:hover:text-primary transition-colors duration-300 flex items-center group hover-arrow-animation'
                  >
                    {card.link.text}
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='ml-1 h-3 w-3 sm:h-4 sm:w-4 transform transition-transform duration-300'
                    >
                      <path d='m9 18 6-6-6-6' />
                    </svg>
                  </Link>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Pagination indicators - mobile only */}
      <div
        className='flex justify-center mt-4 gap-2'
        role='tablist'
        aria-label='Card navigation'
      >
        {Array.from({ length: totalCards }).map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              currentCardIndex === index
                ? 'w-6 bg-primary'
                : 'w-2 bg-primary/30'
            }`}
            onClick={() => {
              setCurrentCardIndex(index)
              const cardElements =
                scrollContainerRef.current?.querySelectorAll('.card-item')
              if (cardElements && cardElements[index]) {
                scrollContainerRef.current?.scrollTo({
                  left:
                    cardElements[index].getBoundingClientRect().left +
                    scrollContainerRef.current.scrollLeft -
                    scrollContainerRef.current.getBoundingClientRect().left,
                  behavior: 'smooth',
                })
              }
            }}
            aria-label={`Go to card ${index + 1} of ${totalCards}`}
            role='tab'
            aria-selected={currentCardIndex === index}
            tabIndex={currentCardIndex === index ? 0 : -1}
          />
        ))}
      </div>
    </div>
  )
}
