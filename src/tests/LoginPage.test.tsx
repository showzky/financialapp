import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Login } from '@/pages/Login'
import { authApi } from '@/services/authApi'

vi.mock('@/services/backendClient', () => ({
  hasBackendConfig: () => true,
}))

vi.mock('@/services/authApi', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getRegistrationStatus: vi.fn(),
    getAuthSettings: vi.fn(),
    updateAuthSettings: vi.fn(),
  },
}))

const mockedAuthApi = vi.mocked(authApi)

describe('Login page registration mode', () => {
  beforeEach(() => {
    mockedAuthApi.login.mockReset()
    mockedAuthApi.register.mockReset()
    mockedAuthApi.getRegistrationStatus.mockReset()
  })

  it('disables register mode when backend registration is off', async () => {
    mockedAuthApi.getRegistrationStatus.mockResolvedValue({ publicRegistrationEnabled: false })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAuthApi.getRegistrationStatus).toHaveBeenCalled()
    })

    const registerButton = screen.getByRole('button', { name: 'Register' })
    expect(registerButton).toBeDisabled()
    expect(
      screen.queryByText('Public registration is currently disabled by the administrator.'),
    ).not.toBeInTheDocument()
  })

  it('shows register form fields when registration is enabled', async () => {
    mockedAuthApi.getRegistrationStatus.mockResolvedValue({ publicRegistrationEnabled: true })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAuthApi.getRegistrationStatus).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    expect(screen.getByPlaceholderText('Andre')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })
})
