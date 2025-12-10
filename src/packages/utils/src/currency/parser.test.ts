import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deflateAmount, getPrecision, inflateAmount } from './parser';

describe('inflateAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 0n when amount is undefined', () => {
    const result = inflateAmount(undefined, 'USDC:ethereum');
    expect(result).toBe(0n);
  });

  it('should return 0n when amount is empty string', () => {
    const result = inflateAmount('', 'USDC:ethereum');
    expect(result).toBe(0n);
  });

  it('should return 0n when asset is undefined', () => {
    const result = inflateAmount('100', undefined);
    expect(result).toBe(0n);
  });

  it('should return 0n when asset is empty string', () => {
    const result = inflateAmount('100', '');
    expect(result).toBe(0n);
  });

  it('should inflate amount with asset precision', () => {
    const result = inflateAmount('1.23', 'USDC:ethereum');
    expect(result).toBe(1230000n);
  });

  it('should inflate amount with currency precision when asset precision is not available', () => {
    const result = inflateAmount('10.5', 'USDC:ethereum');
    expect(result).toBe(10500000n);
  });

  it('should handle whole numbers', () => {
    const result = inflateAmount('100', 'USDC:ethereum');
    expect(result).toBe(100000000n);
  });

  it('should handle numeric input', () => {
    const result = inflateAmount(42.5, 'USDC:ethereum');
    expect(result).toBe(42500000n);
  });

  it('should handle very small amounts', () => {
    const result = inflateAmount('0.000001', 'ETH:ethereum');
    expect(result).toBe(1000000000000n);
  });

  it('should return 0n when precision is 0 from currency config', () => {
    const result = inflateAmount('100', 'DDDD:ethereum');
    expect(result).toBe(100n);
  });

  it('should handle zero amount', () => {
    const result = inflateAmount('0', 'USDC:ethereum');
    expect(result).toBe(0n);
  });

  it('should handle negative amounts', () => {
    const result = inflateAmount('-10.5', 'USDC:ethereum');
    expect(result).toBe(-10500000n);
  });

  it('should handle USDT on BNB Smart Chain', () => {
    const result = inflateAmount('100.5', 'USDT:bnb-smart-chain');
    expect(result).toBe(100500000000000000000n);
  });

  it('should handle small amounts for USDT on BNB Smart Chain', () => {
    const result = inflateAmount('0.001', 'USDT:bnb-smart-chain');
    expect(result).toBe(1000000000000000n);
  });
});

describe('deflateAmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return empty string when amount is undefined', () => {
    const result = deflateAmount(undefined, 'USDC:ethereum');
    expect(result).toBe('');
  });

  it('should return empty string when asset is undefined', () => {
    const result = deflateAmount(1230000n, undefined);
    expect(result).toBe('');
  });

  it('should return empty string when asset is empty string', () => {
    const result = deflateAmount(1230000n, '');
    expect(result).toBe('');
  });

  it('should deflate amount with asset precision', () => {
    const result = deflateAmount(1230000n, 'USDC:ethereum');
    expect(result).toBe('1.23');
  });

  it('should deflate amount with currency precision when asset precision is not available', () => {
    const result = deflateAmount(1050n, 'USDC:ethereum');
    expect(result).toBe('0.00105');
  });

  it('should handle whole numbers', () => {
    const result = deflateAmount(100000000n, 'USDC:ethereum');
    expect(result).toBe('100');
  });

  it('should handle very large amounts', () => {
    const result = deflateAmount(1000000000000000000n, 'ETH:ethereum');
    expect(result).toBe('1');
  });

  it('should handle very small amounts', () => {
    const result = deflateAmount(1000000000000n, 'ETH:ethereum');
    expect(result).toBe('0.000001');
  });

  it('should handle zero amount', () => {
    const result = deflateAmount(0n, 'USDC:ethereum');
    expect(result).toBe('0');
  });

  it('should handle negative amounts', () => {
    const result = deflateAmount(-10500000n, 'USDC:ethereum');
    expect(result).toBe('-10.5');
  });

  it('should handle USDT on BNB Smart Chain', () => {
    const result = deflateAmount(
      100500000000000000000n,
      'USDT:bnb-smart-chain'
    );
    expect(result).toBe('100.5');
  });

  it('should handle small amounts for USDT on BNB Smart Chain', () => {
    const result = deflateAmount(1000000000000000n, 'USDT:bnb-smart-chain');
    expect(result).toBe('0.001');
  });

  it('should handle precision of 0', () => {
    const result = deflateAmount(100n, 'DDDD:ethereum');
    expect(result).toBe('100');
  });
});

describe('getPrecision', () => {
  it('should return asset precision when available', () => {
    const precision = getPrecision('USDC:ethereum');
    expect(precision).toBe(6);
  });

  it('should return currency precision when asset precision is not available', () => {
    const precision = getPrecision('USDC:unknown-chain');
    expect(precision).toBe(6);
  });

  it('should return 0 when neither asset nor currency config exists', () => {
    const precision = getPrecision('UNKNOWN:unknown-chain');
    expect(precision).toBe(0);
  });

  it('should handle ETH with 18 decimals', () => {
    const precision = getPrecision('ETH:ethereum');
    expect(precision).toBe(18);
  });

  it('should handle USDT on BNB Smart Chain', () => {
    const precision = getPrecision('USDT:bnb-smart-chain');
    expect(precision).toBe(18);
  });

  it('should handle BTC with 8 decimals', () => {
    const precision = getPrecision('BTC:bitcoin');
    expect(precision).toBe(8);
  });

  it('should handle SOL with 9 decimals', () => {
    const precision = getPrecision('SOL:solana');
    expect(precision).toBe(9);
  });

  it('should fallback to currency precision for USDC on unknown chain', () => {
    const precision = getPrecision('USDC:non-existent-chain');
    expect(precision).toBe(6);
  });

  it('should handle USDC on different chains', () => {
    expect(getPrecision('USDC:ethereum')).toBe(6);
    expect(getPrecision('USDC:polygon')).toBe(6);
    expect(getPrecision('USDC:optimism')).toBe(6);
    expect(getPrecision('USDC:solana')).toBe(6);
  });

  it('should return 0 for invalid asset format', () => {
    const precision = getPrecision('INVALID');
    expect(precision).toBe(0);
  });

  it('should return 0 for empty string', () => {
    const precision = getPrecision('');
    expect(precision).toBe(0);
  });
});
