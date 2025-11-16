// test/setup.ts
import { vi } from 'vitest';

// Mock Redis y DB por defecto
vi.mock('../app/server/db/client', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('../app/server/redis/client', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
  connectRedis: vi.fn(),
}));