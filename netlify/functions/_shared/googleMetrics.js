/**
 * Pure deterministic mathematics engine for Google Intelligence.
 * Computes verified metrics before AI invocation without semantic mixing.
 */

/**
 * Calculates review reputation metrics from a list of GoogleReview documents.
 */
export function calculateReputationMetrics(reviews = [], profileRating = 0, profileReviewsTotal = 0) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      totalReviews: profileReviewsTotal || 0,
      averageRating: Number(profileRating) || 0,
      starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      responseRatePercentage: 0,
      avgResponseTimeHours: null,
      unansweredCount: 0,
      answeredCount: 0,
    };
  }

  let totalRatingSum = 0;
  let answeredCount = 0;
  let totalResponseTimeHours = 0;
  let responseTimesCount = 0;

  const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };

  for (const rev of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));
    starDistribution[r] = (starDistribution[r] || 0) + 1;
    totalRatingSum += Number(rev.rating) || 5;

    // Sentiment
    const s = rev.sentiment || (r >= 4 ? 'positive' : r === 3 ? 'neutral' : 'negative');
    sentimentDistribution[s] = (sentimentDistribution[s] || 0) + 1;

    // Replies
    if (rev.replyText && rev.replyText.trim().length > 0) {
      answeredCount++;
      if (typeof rev.responseTimeHours === 'number' && rev.responseTimeHours >= 0) {
        totalResponseTimeHours += rev.responseTimeHours;
        responseTimesCount++;
      }
    }
  }

  const sampleSize = reviews.length;
  const computedAvgRating = sampleSize > 0 ? Number((totalRatingSum / sampleSize).toFixed(1)) : (Number(profileRating) || 0);
  const responseRate = sampleSize > 0 ? Number(((answeredCount / sampleSize) * 100).toFixed(1)) : 0;
  const avgResponseTime = responseTimesCount > 0 ? Math.round(totalResponseTimeHours / responseTimesCount) : null;

  return {
    totalReviews: Math.max(sampleSize, Number(profileReviewsTotal) || sampleSize),
    sampleReviewsCount: sampleSize,
    averageRating: computedAvgRating,
    starDistribution,
    sentimentDistribution,
    responseRatePercentage: responseRate,
    avgResponseTimeHours: avgResponseTime,
    unansweredCount: sampleSize - answeredCount,
    answeredCount,
  };
}

/**
 * Calculates Search Console deterministic metrics from query and page data.
 */
export function calculateSearchConsoleMetrics(gscData = {}) {
  const queries = Array.isArray(gscData.queries) ? gscData.queries : [];
  const pages = Array.isArray(gscData.pages) ? gscData.pages : [];

  let totalClicks = 0;
  let totalImpressions = 0;
  let totalPositionSum = 0;

  for (const q of queries) {
    totalClicks += Number(q.clicks) || 0;
    totalImpressions += Number(q.impressions) || 0;
    totalPositionSum += (Number(q.position) || 50) * (Number(q.impressions) || 1);
  }

  const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const avgPosition = totalImpressions > 0 ? Number((totalPositionSum / totalImpressions).toFixed(1)) : null;

  // Identify high potential queries: high impressions (> 50) but CTR below 3%
  const opportunities = queries
    .filter(q => (Number(q.impressions) || 0) >= 30 && ((Number(q.clicks) || 0) / (Number(q.impressions) || 1)) < 0.03)
    .sort((a, b) => (Number(b.impressions) || 0) - (Number(a.impressions) || 0))
    .slice(0, 5);

  const topQueries = [...queries]
    .sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0))
    .slice(0, 10);

  return {
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition,
    topQueries,
    topPages: pages.slice(0, 5),
    opportunitiesCount: opportunities.length,
    opportunities,
  };
}

/**
 * Calculates Competitive Differential between tenant and local competitors.
 */
export function calculateCompetitiveDifferential(tenantProfile = {}, competitors = []) {
  const tenantRating = Number(tenantProfile.rating) || 0;
  const tenantReviews = Number(tenantProfile.userRatingsTotal) || 0;

  if (!Array.isArray(competitors) || competitors.length === 0) {
    return {
      competitorsCount: 0,
      avgCompetitorRating: 0,
      avgCompetitorReviews: 0,
      ratingGap: 0,
      reviewsGap: 0,
      leaderboard: [],
    };
  }

  let compRatingSum = 0;
  let compReviewsSum = 0;

  const validCompetitors = competitors.filter(c => c && c.name);
  for (const c of validCompetitors) {
    compRatingSum += Number(c.rating) || 0;
    compReviewsSum += Number(c.userRatingsTotal) || 0;
  }

  const count = validCompetitors.length;
  const avgRating = count > 0 ? Number((compRatingSum / count).toFixed(1)) : 0;
  const avgReviews = count > 0 ? Math.round(compReviewsSum / count) : 0;

  const allPlayers = [
    {
      name: tenantProfile.businessName || 'Tu Empresa',
      isTenant: true,
      rating: tenantRating,
      reviews: tenantReviews,
      category: tenantProfile.category || 'General',
    },
    ...validCompetitors.map(c => ({
      name: c.name,
      isTenant: false,
      rating: Number(c.rating) || 0,
      reviews: Number(c.userRatingsTotal) || 0,
      category: c.category || 'General',
    })),
  ].sort((a, b) => {
    // Score based on weighted rating and review volume
    const scoreA = a.rating * 20 + Math.min(50, Math.log10(Math.max(1, a.reviews)) * 15);
    const scoreB = b.rating * 20 + Math.min(50, Math.log10(Math.max(1, b.reviews)) * 15);
    return scoreB - scoreA;
  });

  const tenantRank = allPlayers.findIndex(p => p.isTenant) + 1;

  return {
    competitorsCount: count,
    avgCompetitorRating: avgRating,
    avgCompetitorReviews: avgReviews,
    ratingGap: Number((tenantRating - avgRating).toFixed(1)),
    reviewsGap: tenantReviews - avgReviews,
    tenantRank,
    totalPlayers: allPlayers.length,
    leaderboard: allPlayers,
  };
}
