import { describe, expect, it } from 'vitest';
import { createStreamSchema } from '../src/validators/stream.validator.js';

// The controller imports this same exported schema. These tests intentionally
// exercise the real production validator rather than recreating its rules.
// The sample addresses test only the validator's G-prefixed base32 shape, not
// Stellar checksum validity (which this schema does not currently verify).
const SENDER = `G${'A'.repeat(55)}`;
const RECIPIENT = `G${'B'.repeat(55)}`;

const validStream = () => ({
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 12.5,
  token: 'USDC',
});

function expectFieldError(payload: Record<string, unknown>, field: string) {
  const result = createStreamSchema.safeParse(payload);
  expect(result.success).toBe(false);
  if (result.success) throw new Error(`Expected ${field} to fail validation`);
  expect(result.error.issues.some((issue) => issue.path.join('.') === field)).toBe(
    true,
  );
}

describe('createStreamSchema: valid inputs', () => {
  it('parses the same data shape accepted by the POST /streams controller', () => {
    expect(createStreamSchema.parse(validStream())).toEqual(validStream());
  });

  it('accepts a small positive fractional amount', () => {
    const input = { ...validStream(), amount: 0.000001 };
    expect(createStreamSchema.safeParse(input).success).toBe(true);
  });

  it('accepts both optional times with a strictly later end', () => {
    const input = { ...validStream(), startTime: 1000, endTime: 1001 };
    expect(createStreamSchema.parse(input)).toEqual(input);
  });

  it.each([
    ['startTime only', { startTime: 1000 }],
    ['endTime only', { endTime: 2000 }],
    ['neither timestamp', {}],
    ['zero start with later end', { startTime: 0, endTime: 1 }],
  ])('accepts %s', (_label, times) => {
    expect(createStreamSchema.safeParse({ ...validStream(), ...times }).success).toBe(
      true,
    );
  });
});

describe.each(['sender', 'recipient'] as const)(
  'createStreamSchema: %s Stellar-address format',
  (field) => {
    it('accepts a G-prefixed 56-character base32-shaped address', () => {
      expect(createStreamSchema.safeParse(validStream()).success).toBe(true);
    });

    it.each([
      ['wrong prefix', `C${'A'.repeat(55)}`],
      ['55 characters', `G${'A'.repeat(54)}`],
      ['57 characters', `G${'A'.repeat(56)}`],
      ['lowercase character', `G${'a'.repeat(55)}`],
      ['0 is outside base32 alphabet', `G${'0'.repeat(55)}`],
      ['empty string', ''],
      ['number', 123],
      ['null', null],
      ['missing value', undefined],
    ])('rejects %s', (_label, value) => {
      expectFieldError({ ...validStream(), [field]: value }, field);
    });
  },
);

describe('createStreamSchema: amount', () => {
  it.each([
    ['zero', 0],
    ['negative number', -1],
    ['numeric string', '15'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['null', null],
    ['missing', undefined],
  ])('rejects %s', (_label, amount) => {
    expectFieldError({ ...validStream(), amount }, 'amount');
  });

  it.each([1, 10.25, Number.MIN_VALUE])('accepts positive amount %s', (amount) => {
    expect(createStreamSchema.safeParse({ ...validStream(), amount }).success).toBe(
      true,
    );
  });
});

describe('createStreamSchema: token', () => {
  it.each([
    ['empty string', ''],
    ['null', null],
    ['number', 1],
    ['missing', undefined],
  ])('rejects %s', (_label, token) => {
    expectFieldError({ ...validStream(), token }, 'token');
  });

  it('accepts a non-empty token identifier', () => {
    expect(createStreamSchema.safeParse({ ...validStream(), token: 'XLM' }).success).toBe(
      true,
    );
  });
});

describe('createStreamSchema: optional timestamps and ordering', () => {
  it.each([
    ['equal timestamps', 10, 10],
    ['end before start', 10, 9],
    ['equal zero timestamps', 0, 0],
  ])('rejects %s at the endTime path', (_label, startTime, endTime) => {
    const payload = { ...validStream(), startTime, endTime };
    expectFieldError(payload, 'endTime');
    const result = createStreamSchema.safeParse(payload);
    if (result.success) throw new Error('Expected ordering validation to fail');
    expect(
      result.error.issues.some(
        (issue) =>
          issue.path.join('.') === 'endTime' &&
          issue.message === 'endTime must be strictly greater than startTime',
      ),
    ).toBe(true);
  });

  it.each([
    ['startTime string', 'startTime', '100'],
    ['endTime string', 'endTime', '101'],
    ['startTime null', 'startTime', null],
    ['endTime null', 'endTime', null],
  ])('rejects %s', (_label, field, value) => {
    expectFieldError({ ...validStream(), [field]: value }, field);
  });

  it('reports invalid sender and amount on their own fields', () => {
    const result = createStreamSchema.safeParse({
      ...validStream(),
      sender: 'not-an-address',
      amount: 0,
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected multiple validation failures');
    const fields = result.error.issues.map((issue) => issue.path.join('.'));
    expect(fields).toContain('sender');
    expect(fields).toContain('amount');
  });
});
