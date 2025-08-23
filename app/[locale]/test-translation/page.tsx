'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import TranslatedText from '@/components/shared/translated-text'

export default function TranslationTestPage() {
  const locale = useLocale()
  const [testText] = useState('This is a great product with amazing features')

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-bold'>Translation Test Page</h1>

      <div className='bg-gray-100 p-4 rounded'>
        <p>
          <strong>Current Locale:</strong> {locale}
        </p>
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Original Text:</h2>
        <p className='p-4 bg-blue-50 rounded'>{testText}</p>

        <h2 className='text-xl font-semibold'>Translated Text:</h2>
        <div className='p-4 bg-green-50 rounded'>
          <TranslatedText
            text={testText}
            fallback={testText}
            enableTranslation={true}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>Test Different Texts:</h2>
        <div className='space-y-3'>
          <div className='p-3 border rounded'>
            <p className='font-medium'>Product Description Example:</p>
            <TranslatedText
              text='This smartphone features a high-resolution camera, long battery life, and premium design.'
              fallback='This smartphone features a high-resolution camera, long battery life, and premium design.'
              enableTranslation={true}
            />
          </div>

          <div className='p-3 border rounded'>
            <p className='font-medium'>Simple Text:</p>
            <TranslatedText
              text='Hello World'
              fallback='Hello World'
              enableTranslation={true}
            />
          </div>
        </div>
      </div>

      <div className='mt-6 p-4 bg-yellow-50 rounded'>
        <p>
          <strong>Instructions:</strong>
        </p>
        <p>1. Change the language using the language switcher in the header</p>
        <p>2. Watch if the translated text updates automatically</p>
        <p>3. Check the browser console for any errors</p>
      </div>
    </div>
  )
}
