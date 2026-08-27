import { describe, it, expect } from 'vitest';
import { calculateSocialMetrics } from '../../netlify/functions/_shared/socialMetrics.js';

describe('Stage 8 — Deterministic Social Metrics Engine Tests', () => {
  it('1. Maneja snapshots vacíos sin arrojar excepciones y con valores en cero seguros', () => {
    const res = calculateSocialMetrics({ posts: [] }, { followersCount: 5000, followsCount: 300 });

    expect(res.postsCount).toBe(0);
    expect(res.followersCount).toBe(5000);
    expect(res.cadence.postsPerWeek).toBe(0);
    expect(res.consistencyScore).toBe(0);
    expect(res.rates.engagementRateOverReach).toBeNull();
    expect(res.rates.engagementRateOverFollowers).toBeNull();
    expect(res.topPosts).toEqual([]);
  });

  it('2. Calcula cadencia, distribución de formatos y engagement rate sobre alcance', () => {
    const mockPosts = [
      {
        id: 'p1',
        timestamp: '2026-08-01T12:00:00Z',
        format: 'reel',
        likes: 100,
        comments: 20,
        shares: 10,
        saves: 20,
        reach: 2000,
        impressions: 3000,
      },
      {
        id: 'p2',
        timestamp: '2026-08-05T12:00:00Z',
        format: 'carousel',
        likes: 80,
        comments: 10,
        shares: 5,
        saves: 15,
        reach: 1500,
        impressions: 2200,
      },
      {
        id: 'p3',
        timestamp: '2026-08-09T12:00:00Z',
        format: 'image',
        likes: 50,
        comments: 5,
        shares: 2,
        saves: 3,
        reach: 1000,
        impressions: 1200,
      },
      {
        id: 'p4',
        timestamp: '2026-08-13T12:00:00Z',
        format: 'reel',
        likes: 120,
        comments: 25,
        shares: 15,
        saves: 30,
        reach: 2500,
        impressions: 3500,
      },
    ];

    const res = calculateSocialMetrics({ posts: mockPosts }, { followersCount: 10000, followsCount: 450 });

    expect(res.postsCount).toBe(4);
    expect(res.followersCount).toBe(10000);
    // Formats: 2 reels (50%), 1 carousel (25%), 1 image (25%)
    expect(res.formatDistribution.reel).toBe(2);
    expect(res.formatDistribution.carousel).toBe(1);
    expect(res.formatDistribution.image).toBe(1);
    expect(res.formatPercentages.reel).toBe(50);
    expect(res.formatPercentages.carousel).toBe(25);
    expect(res.formatPercentages.image).toBe(25);

    // Totals: likes = 350, comments = 60, shares = 32, saves = 68. Total interactions = 510
    expect(res.totals.likes).toBe(350);
    expect(res.totals.comments).toBe(60);
    expect(res.totals.saves).toBe(68);
    expect(res.totals.interactions).toBe(510);
    expect(res.totals.reach).toBe(7000);

    // ER over reach = (510 / 7000) * 100 = 7.29%
    expect(res.rates.engagementRateOverReach).toBe(7.29);

    // Top posts: p4 (190 interactions), p1 (150 interactions), p2 (110 interactions)
    expect(res.topPosts.length).toBe(3);
    expect(res.topPosts[0].id).toBe('p4');
    expect(res.topPosts[1].id).toBe('p1');
    expect(res.topPosts[2].id).toBe('p2');

    // Bottom post: p3 (60 interactions)
    expect(res.bottomPosts.length).toBe(3);
    expect(res.bottomPosts[0].id).toBe('p3');
  });

  it('3. Calcula consistencia alta con intervalos regulares y baja con intervalos erráticos', () => {
    // Regular: exactly every 3 days
    const regularPosts = [
      { id: '1', timestamp: '2026-08-01T10:00:00Z', likes: 10 },
      { id: '2', timestamp: '2026-08-04T10:00:00Z', likes: 10 },
      { id: '3', timestamp: '2026-08-07T10:00:00Z', likes: 10 },
      { id: '4', timestamp: '2026-08-10T10:00:00Z', likes: 10 },
    ];

    const resRegular = calculateSocialMetrics({ posts: regularPosts });
    expect(resRegular.consistencyScore).toBeGreaterThanOrEqual(90);

    // Irregular: 20 days silence, then 3 posts in 1 hour
    const erraticPosts = [
      { id: '1', timestamp: '2026-08-01T10:00:00Z', likes: 10 },
      { id: '2', timestamp: '2026-08-25T10:00:00Z', likes: 10 },
      { id: '3', timestamp: '2026-08-25T11:00:00Z', likes: 10 },
      { id: '4', timestamp: '2026-08-25T12:00:00Z', likes: 10 },
    ];

    const resErratic = calculateSocialMetrics({ posts: erraticPosts });
    expect(resErratic.consistencyScore).toBeLessThan(resRegular.consistencyScore);
  });
});
