export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; action?: string }>(event)
  const token = body?.token
  const action = body?.action || 'LOGIN'

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing reCAPTCHA token' })
  }

  const config = useRuntimeConfig()
  const projectId = config.recaptchaProjectId
  const apiKey = config.recaptchaApiKey
  const siteKey = config.public.recaptchaSiteKey

  if (!projectId || !apiKey || !siteKey) {
    throw createError({ statusCode: 500, statusMessage: 'reCAPTCHA is not configured' })
  }

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`
  const payload = {
    event: {
      token,
      siteKey,
      expectedAction: action
    }
  }

  const resp = await $fetch<any>(url, { method: 'POST', body: payload })

  const valid = resp?.tokenProperties?.valid === true
  const actionMatches = resp?.tokenProperties?.action === action
  const score: number | undefined = resp?.riskAnalysis?.score

  if (!valid || !actionMatches) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid reCAPTCHA token' })
  }

  // Basic thresholding; adjust as needed
  const threshold = 0.5
  if (typeof score === 'number' && score < threshold) {
    throw createError({ statusCode: 403, statusMessage: 'Low reCAPTCHA score' })
  }

  return { success: true, score }
})


