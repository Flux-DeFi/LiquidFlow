import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// A valid 56-char Stellar public key (G + 55 uppercase base32 chars A-Z2-7).
const VALID_SENDER =    'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
const VALID_RECIPIENT = 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBZLBZAABIVVNMZFIHFQO';

describe('POST /streams', () => {
  // ── existing passing tests (updated to use real Stellar keys) ──────────────

  it('should return 201 and mock response when validation succeeds', async () => {
    const validData = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: 100,
      token: 'USDC',
    };

    const response = await request(app)
      .post('/streams')
      .send(validData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: '123',
      status: 'pending',
      ...validData,
    });
  });

  it('should return 400 when validation fails (missing fields)', async () => {
    const invalidData = {
      sender: VALID_SENDER,
      // recipient missing
      amount: 100,
      token: 'USDC',
    };

    const response = await request(app)
      .post('/streams')
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toBeDefined();
  });

  it('should return 400 when validation fails (invalid amount)', async () => {
    const invalidData = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      amount: -10,
      token: 'USDC',
    };

    const response = await request(app)
      .post('/streams')
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  // ── new tests for address format and time ordering ─────────────────────────

  it('should return 400 when sender is a malformed Stellar address', async () => {
    const response = await request(app)
      .post('/streams')
      .send({
        sender: 'GB...123',          // too short, invalid chars
        recipient: VALID_RECIPIENT,
        amount: 100,
        token: 'USDC',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');

    const errors: { path: string[] }[] = response.body.errors;
    expect(errors.some((e) => e.path.includes('sender'))).toBe(true);
  });

  it('should return 400 when recipient is a malformed Stellar address', async () => {
    const response = await request(app)
      .post('/streams')
      .send({
        sender: VALID_SENDER,
        recipient: 'INVALID_ADDRESS',  // no G prefix, wrong length
        amount: 100,
        token: 'USDC',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');

    const errors: { path: string[] }[] = response.body.errors;
    expect(errors.some((e) => e.path.includes('recipient'))).toBe(true);
  });

  it('should return 400 when endTime equals startTime (zero-duration stream)', async () => {
    const response = await request(app)
      .post('/streams')
      .send({
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 50,
        token: 'USDC',
        startTime: 1_000_000,
        endTime:   1_000_000,   // equal → not strictly greater
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');

    const errors: { path: string[] }[] = response.body.errors;
    expect(errors.some((e) => e.path.includes('endTime'))).toBe(true);
  });

  it('should return 400 when endTime is less than startTime (negative-duration stream)', async () => {
    const response = await request(app)
      .post('/streams')
      .send({
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 50,
        token: 'USDC',
        startTime: 2_000_000,
        endTime:   1_000_000,   // earlier than startTime
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');

    const errors: { path: string[] }[] = response.body.errors;
    expect(errors.some((e) => e.path.includes('endTime'))).toBe(true);
  });

  it('should return 201 when endTime is strictly greater than startTime', async () => {
    const response = await request(app)
      .post('/streams')
      .send({
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 75,
        token: 'USDC',
        startTime: 1_000_000,
        endTime:   2_000_000,   // valid
      });

    expect(response.status).toBe(201);
  });
});
