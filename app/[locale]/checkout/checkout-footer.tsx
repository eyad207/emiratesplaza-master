import useSettingStore from '@/hooks/use-setting-store'
import Link from 'next/link'
import React from 'react'
import { useTranslations } from 'next-intl'

export default function CheckoutFooter() {
  const t = useTranslations('CheckoutFooter')
  const {
    setting: { site },
  } = useSettingStore()
  return (
    <div className='border-t-2 space-y-2 my-4 py-4'>
      <p>
        {t('needHelp')} <Link href='/page/help'>{t('helpCenter')}</Link>{' '}
        {t('or')} <Link href='/page/contact-us'>{t('contactUs')}</Link>
      </p>
      <p>
        {t('itemOrderedFrom', { siteName: site.name })}{' '}
        <Link href='/page/privacy-policy'>{t('privacyNotice')}</Link> {t('and')}{' '}
        <Link href='/page/conditions-of-use'>{t('conditionsOfUse')}</Link>.
      </p>
      <p>
        {t('returnPolicy')}{' '}
        <Link href='/page/returns-policy'>
          {t('seeReturnsPolicy', { siteName: site.name })}
        </Link>
      </p>
    </div>
  )
}
