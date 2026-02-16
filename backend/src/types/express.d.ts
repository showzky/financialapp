// ADD THIS: express request augmentation for authenticated user context
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        email?: string
      }
    }
  }
}

export {}
