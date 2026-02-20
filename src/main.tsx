import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.tsx'
import { BudgetProvider } from '@/context/BudgetContext' // ADD THIS
import { FinanceDataProvider } from '@/context/FinanceDataContext' // ADD THIS

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {' '}
      {/* ADD THIS: router provider */}
      <BudgetProvider>
        <FinanceDataProvider>
          {' '}
          {/* ADD THIS: active + history state provider */}
          <App />
          <SpeedInsights />
        </FinanceDataProvider>
      </BudgetProvider>
    </BrowserRouter>
  </StrictMode>,
)
