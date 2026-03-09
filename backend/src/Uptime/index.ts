import { Router } from 'express'

export const uptimeRouter = Router()

uptimeRouter.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.type('text/plain').status(200).send('ok')
})

uptimeRouter.head('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).end()
})