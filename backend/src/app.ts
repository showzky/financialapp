// ADD THIS: secure express app bootstrap
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import rateLimit from 'express-rate-limit'
import pinoHttpModule from 'pino-http'
import { uptimeRouter } from './Uptime/index.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { requireAuth } from './middleware/requireAuth.js'
import { authRouter } from './routes/authRoutes.js'
import { apiRouter } from './routes/index.js'
import { errorHandler, notFoundHandler } from './utils/errorHandler.js'

const pinoHttp = pinoHttpModule.default ?? pinoHttpModule

const app = express()

app.set('trust proxy', 1)
app.set('etag', false)

// Keep the uptime probe path extremely cheap so external monitors can ping it.
app.use(uptimeRouter)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  }),
)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: false,
  }),
)
app.use(hpp())
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: false, limit: '100kb' }))
app.use(pinoHttp({ logger }))

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
})

app.use('/api/v1/auth', authRateLimiter, authRouter)
app.use('/api/v1', requireAuth, apiRouter)
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Backend server is running')
})
