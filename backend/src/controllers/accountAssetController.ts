import { z } from 'zod'
import type { Request, Response } from 'express'
import { searchAccountIcons } from '../services/accountIconSearchService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const searchIconQuerySchema = z.object({
  query: z.string().trim().min(2).max(120),
})

export const searchAccountIconsController = asyncHandler(async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  const parsedQuery = searchIconQuerySchema.parse(req.query)
  const results = await searchAccountIcons(parsedQuery.query)
  res.status(200).json(results)
})
