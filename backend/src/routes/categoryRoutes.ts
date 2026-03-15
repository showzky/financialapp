// ADD THIS: category route registration
import { Router } from 'express'
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  resetDefaultCategories,
  updateCategory,
} from '../controllers/categoryController.js'

export const categoryRouter = Router()

categoryRouter.post('/reset-defaults', resetDefaultCategories)
categoryRouter.post('/', createCategory)
categoryRouter.get('/', listCategories)
categoryRouter.get('/:id', getCategoryById)
categoryRouter.patch('/:id', updateCategory)
categoryRouter.delete('/:id', deleteCategory)
