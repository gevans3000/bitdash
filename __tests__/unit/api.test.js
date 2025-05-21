const { updateRateLimitInfo, rateLimit } = require('../../src/api');

describe('updateRateLimitInfo', () => {
  afterEach(() => {
    // reset rateLimit after each test
    rateLimit.remaining = 0;
    rateLimit.limit = 0;
    rateLimit.resetTime = 0;
    rateLimit.remainingTime = 0;
    rateLimit.lastUpdated = null;
  });

  test('updates rate limit info with valid headers', () => {
    const headers = {
      'x-ratelimit-remaining': '5',
      'x-ratelimit': '10',
      'x-ratelimit-reset': `${Math.floor(Date.now() / 1000) + 60}`,
    };

    updateRateLimitInfo(headers);

    expect(rateLimit.limit).toBe(10);
    expect(rateLimit.remaining).toBe(5);
    expect(rateLimit.remainingTime).toBeGreaterThanOrEqual(0);
    expect(rateLimit.lastUpdated).not.toBeNull();
  });

  test('handles missing headers gracefully', () => {
    updateRateLimitInfo({});
    expect(rateLimit.limit).toBe(0);
  });

  test('handles null input without throwing', () => {
    expect(() => updateRateLimitInfo(null)).not.toThrow();
  });
});
