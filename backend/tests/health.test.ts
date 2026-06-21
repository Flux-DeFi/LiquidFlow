import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Health check endpoints', () => {
  it('GET / returns 200 with running message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('FlowFi Backend is running');
  });

  it('GET /health returns 200 with health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.timestamp).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.version).toBe('1.0.0');
  });
});
