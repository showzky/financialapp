import { Router } from 'express'
import {
  createLoan,
  deleteLoan,
  getLoanSummary,
  listLoans,
  markLoanRepaid,
  updateLoan,
} from '../controllers/loanController.js'

export const loanRouter = Router()

loanRouter.get('/', listLoans)
loanRouter.get('/summary', getLoanSummary)
loanRouter.post('/', createLoan)
loanRouter.patch('/:id', updateLoan)
loanRouter.patch('/:id/repaid', markLoanRepaid)
loanRouter.delete('/:id', deleteLoan)
