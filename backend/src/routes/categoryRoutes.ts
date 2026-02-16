// ADD THIS: category route registration
import { Router } from 'express'
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from '../controllers/categoryController.js'

export const categoryRouter = Router()

categoryRouter.post('/', createCategory)
categoryRouter.get('/', listCategories)
categoryRouter.get('/:id', getCategoryById)
categoryRouter.patch('/:id', updateCategory)
categoryRouter.delete('/:id', deleteCategory)
