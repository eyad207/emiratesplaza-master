import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface EmailTemplateProps {
  firstName: string
  code: string
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  code,
}) => (
  <Html>
    <Head />
    <Preview>Your Verification Code</Preview>
    <Tailwind>
      <Body className='font-sans bg-white'>
        <Container className='max-w-xl p-4'>
          <Heading className='text-2xl font-bold'>
            Welcome, {firstName}!
          </Heading>
          <Section className='mt-4'>
            <Text className='text-lg'>Your verification code is:</Text>
            <Text className='text-2xl font-bold'>{code}</Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
