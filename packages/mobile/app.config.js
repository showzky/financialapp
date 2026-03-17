module.exports = ({ config }) => {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim().replace(/\/+$/, '')
  const backendAuthToken = process.env.EXPO_PUBLIC_BACKEND_AUTH_TOKEN?.trim()

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      backendUrl: backendUrl || undefined,
      backendAuthToken: backendAuthToken || undefined,
    },
  }
}