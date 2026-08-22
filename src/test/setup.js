import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock firebase/auth validatePassword
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    validatePassword: vi.fn().mockResolvedValue({ isValid: true }),
  };
});
