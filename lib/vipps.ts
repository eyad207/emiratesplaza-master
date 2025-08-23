const base = process.env.VIPPS_API_URL || 'https://api.vipps.no'

export const vipps = {
  createPayment: async function createPayment(orderId: string, amount: number) {
    const accessToken = await generateAccessToken()
    const url = `${base}/ecomm/v2/payments`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
      },
      body: JSON.stringify({
        merchantInfo: {
          merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER!,
          callbackPrefix: `${process.env.NEXT_PUBLIC_APP_URL}/vipps/callback`,
          fallBack: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${orderId}`,
        },
        transaction: {
          orderId,
          amount: amount * 100, // Vipps expects amount in øre (1 NOK = 100 øre)
          transactionText: 'Order Payment',
        },
      }),
    })
    return handleResponse(response)
  },
  capturePayment: async function capturePayment(orderId: string) {
    const accessToken = await generateAccessToken()
    const url = `${base}/ecomm/v2/payments/${orderId}/capture`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
      },
    })
    return handleResponse(response)
  },
}

async function generateAccessToken() {
  const { VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET } = process.env
  const auth = Buffer.from(
    `${VIPPS_CLIENT_ID}:${VIPPS_CLIENT_SECRET}`
  ).toString('base64')
  const response = await fetch(`${base}/accesstoken/get`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!,
    },
  })
  const jsonData = await handleResponse(response)
  return jsonData.access_token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleResponse(response: any) {
  if (response.ok) {
    return response.json()
  }
  const errorMessage = await response.text()
  throw new Error(errorMessage)
}
