/**
 * Deterministic Social Metrics Engine for Anima MKT CRM
 * Calculates strictly verifiable commercial and social KPIs prior to AI analysis.
 */

export function calculateSocialMetrics(snapshot, profile = {}) {
  const posts = snapshot?.posts || [];
  const followersCount = Math.max(0, parseInt(profile?.followersCount ?? snapshot?.profileMetrics?.followersCount ?? 0, 10));
  const followsCount = Math.max(0, parseInt(profile?.followsCount ?? snapshot?.profileMetrics?.followsCount ?? 0, 10));

  if (!Array.isArray(posts) || posts.length === 0) {
    return {
      postsCount: 0,
      followersCount,
      followsCount,
      cadence: { postsPerWeek: 0, postsPerMonth: 0, avgDaysBetweenPosts: 0 },
      formatDistribution: { image: 0, video: 0, reel: 0, carousel: 0, story: 0 },
      formatPercentages: { image: 0, video: 0, reel: 0, carousel: 0, story: 0 },
      totals: { likes: 0, comments: 0, shares: 0, saves: 0, impressions: 0, reach: 0, videoViews: 0 },
      averages: { likes: 0, comments: 0, shares: 0, saves: 0, interactions: 0 },
      rates: {
        engagementRateOverReach: null,
        engagementRateOverImpressions: null,
        engagementRateOverFollowers: null,
        saveRate: null,
        commentToLikeRatio: null,
      },
      topPosts: [],
      bottomPosts: [],
      consistencyScore: 0,
      dataQuality: {
        hasReachData: false,
        hasImpressionsData: false,
        hasSavesData: false,
        postsAnalyzed: 0,
        coverageDays: 0,
      },
    };
  }

  // 1. Sort posts chronologically
  const sortedPosts = [...posts].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const firstPostDate = new Date(sortedPosts[0].timestamp);
  const lastPostDate = new Date(sortedPosts[sortedPosts.length - 1].timestamp);
  const timeSpanMs = Math.max(lastPostDate.getTime() - firstPostDate.getTime(), 1000 * 60 * 60 * 24); // at least 1 day
  const coverageDays = Math.max(1, Math.round(timeSpanMs / (1000 * 60 * 60 * 24)));
  const coverageWeeks = Math.max(1, coverageDays / 7);
  const coverageMonths = Math.max(1, coverageDays / 30);

  // 2. Format breakdown
  const formatCounts = { image: 0, video: 0, reel: 0, carousel: 0, story: 0 };
  sortedPosts.forEach((p) => {
    const fmt = p.format || 'image';
    if (formatCounts[fmt] !== undefined) {
      formatCounts[fmt]++;
    } else {
      formatCounts.image++;
    }
  });

  const formatPercentages = {};
  Object.keys(formatCounts).forEach((fmt) => {
    formatPercentages[fmt] = Math.round((formatCounts[fmt] / posts.length) * 1000) / 10;
  });

  // 3. Totals & Interactions
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let totalImpressions = 0;
  let totalReach = 0;
  let totalVideoViews = 0;
  let hasReachCount = 0;
  let hasImpCount = 0;
  let hasSavesCount = 0;

  const postScores = sortedPosts.map((p) => {
    const likes = p.likes || 0;
    const comments = p.comments || 0;
    const shares = p.shares || 0;
    const saves = p.saves || 0;
    const imp = p.impressions || 0;
    const reach = p.reach || 0;
    const views = p.videoViews || 0;

    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    totalSaves += saves;
    totalImpressions += imp;
    totalReach += reach;
    totalVideoViews += views;

    if (reach > 0) hasReachCount++;
    if (imp > 0) hasImpCount++;
    if (saves > 0) hasSavesCount++;

    const interactions = likes + comments + shares + saves;
    return {
      ...p,
      totalInteractions: interactions,
    };
  });

  const totalInteractions = totalLikes + totalComments + totalShares + totalSaves;
  const avgLikes = Math.round((totalLikes / posts.length) * 10) / 10;
  const avgComments = Math.round((totalComments / posts.length) * 10) / 10;
  const avgShares = Math.round((totalShares / posts.length) * 10) / 10;
  const avgSaves = Math.round((totalSaves / posts.length) * 10) / 10;
  const avgInteractions = Math.round((totalInteractions / posts.length) * 10) / 10;

  // 4. Cadence & Consistency
  const postsPerWeek = Math.round((posts.length / coverageWeeks) * 10) / 10;
  const postsPerMonth = Math.round((posts.length / coverageMonths) * 10) / 10;
  const intervalsDays = [];

  for (let i = 1; i < sortedPosts.length; i++) {
    const diffDays = (new Date(sortedPosts[i].timestamp) - new Date(sortedPosts[i - 1].timestamp)) / (1000 * 60 * 60 * 24);
    intervalsDays.push(Math.max(0, diffDays));
  }

  const avgDaysBetween = intervalsDays.length > 0
    ? Math.round((intervalsDays.reduce((a, b) => a + b, 0) / intervalsDays.length) * 10) / 10
    : 0;

  // Consistency Score calculation (0 to 100)
  // Low variance in posting intervals yields higher consistency score
  let consistencyScore = 50; // default for single post
  if (intervalsDays.length > 0) {
    const mean = avgDaysBetween;
    const variance = intervalsDays.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / intervalsDays.length;
    const stdDev = Math.sqrt(variance);
    // If stdDev is close to 0 (very regular), score approaches 100.
    // If stdDev is > 10 days, score drops towards 20.
    consistencyScore = Math.max(10, Math.min(100, Math.round(100 - (stdDev * 8))));
  }

  // 5. Rates
  const hasReach = hasReachCount > 0 && totalReach > 0;
  const hasImpressions = hasImpCount > 0 && totalImpressions > 0;

  const engagementRateOverReach = hasReach
    ? Math.round((totalInteractions / totalReach) * 10000) / 100
    : null;

  const engagementRateOverImpressions = hasImpressions
    ? Math.round((totalInteractions / totalImpressions) * 10000) / 100
    : null;

  const engagementRateOverFollowers = followersCount > 0
    ? Math.round((avgInteractions / followersCount) * 10000) / 100
    : null;

  const saveRate = hasReach
    ? Math.round((totalSaves / totalReach) * 10000) / 100
    : hasImpressions
    ? Math.round((totalSaves / totalImpressions) * 10000) / 100
    : null;

  const commentToLikeRatio = totalLikes > 0
    ? Math.round((totalComments / totalLikes) * 1000) / 10
    : null;

  // 6. Top and Bottom posts
  const postsByInteractions = [...postScores].sort((a, b) => b.totalInteractions - a.totalInteractions);
  const topPosts = postsByInteractions.slice(0, 3);
  const bottomPosts = postsByInteractions.length > 3
    ? [...postsByInteractions].reverse().slice(0, 3)
    : [];

  return {
    postsCount: posts.length,
    followersCount,
    followsCount,
    cadence: {
      postsPerWeek,
      postsPerMonth,
      avgDaysBetweenPosts: avgDaysBetween,
      coverageDays,
    },
    formatDistribution: formatCounts,
    formatPercentages,
    totals: {
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      impressions: totalImpressions,
      reach: totalReach,
      videoViews: totalVideoViews,
      interactions: totalInteractions,
    },
    averages: {
      likes: avgLikes,
      comments: avgComments,
      shares: avgShares,
      saves: avgSaves,
      interactions: avgInteractions,
    },
    rates: {
      engagementRateOverReach,
      engagementRateOverImpressions,
      engagementRateOverFollowers,
      saveRate,
      commentToLikeRatio,
    },
    topPosts,
    bottomPosts,
    consistencyScore,
    dataQuality: {
      hasReachData: hasReach,
      hasImpressionsData: hasImpressions,
      hasSavesData: hasSavesCount > 0,
      postsAnalyzed: posts.length,
      coverageDays,
    },
  };
}
