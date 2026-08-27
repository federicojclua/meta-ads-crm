import { ObjectId } from 'mongodb';

export const MEDIA_FORMATS = ['image', 'video', 'carousel', 'reel', 'story', 'status'];

export function validateSocialSnapshot(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.sourceId) {
    errors.push('El campo sourceId es obligatorio.');
  }

  if (!Array.isArray(data.posts) || data.posts.length === 0) {
    errors.push('El snapshot debe contener al menos una publicación en el array posts.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function normalizePostItem(post, index = 0) {
  const now = new Date();
  const formatRaw = String(post.format || post.media_type || post.type || 'image').toLowerCase();
  let format = 'image';
  if (formatRaw.includes('video') || formatRaw === 'video') format = 'video';
  else if (formatRaw.includes('reel') || formatRaw === 'reel') format = 'reel';
  else if (formatRaw.includes('carousel') || formatRaw.includes('album')) format = 'carousel';
  else if (formatRaw.includes('story')) format = 'story';

  return {
    id: post.id || post.externalId || `post_${Date.now()}_${index}`,
    timestamp: post.timestamp || post.created_time || post.date || now.toISOString(),
    caption: post.caption || post.message || post.text || '',
    format,
    permalink: post.permalink || post.url || post.link || null,
    likes: Math.max(0, parseInt(post.likes ?? post.like_count ?? post.reactions ?? 0, 10) || 0),
    comments: Math.max(0, parseInt(post.comments ?? post.comments_count ?? 0, 10) || 0),
    shares: Math.max(0, parseInt(post.shares ?? post.shares_count ?? 0, 10) || 0),
    saves: Math.max(0, parseInt(post.saves ?? post.saved ?? 0, 10) || 0),
    impressions: Math.max(0, parseInt(post.impressions ?? 0, 10) || 0),
    reach: Math.max(0, parseInt(post.reach ?? 0, 10) || 0),
    videoViews: Math.max(0, parseInt(post.videoViews ?? post.video_views ?? post.views ?? 0, 10) || 0),
  };
}

export function createSocialSnapshotDocument(data, creatorUserId = null) {
  const now = new Date();
  const normalizedPosts = (data.posts || []).map((p, idx) => normalizePostItem(p, idx));

  // Determine period boundaries from posts timestamps
  const timestamps = normalizedPosts
    .map(p => new Date(p.timestamp).getTime())
    .filter(t => !isNaN(t));

  const periodStart = timestamps.length > 0
    ? new Date(Math.min(...timestamps))
    : data.periodStart ? new Date(data.periodStart) : now;

  const periodEnd = timestamps.length > 0
    ? new Date(Math.max(...timestamps))
    : data.periodEnd ? new Date(data.periodEnd) : now;

  return {
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    sourceId: typeof data.sourceId === 'string' ? new ObjectId(data.sourceId) : data.sourceId,
    platform: data.platform || 'instagram',
    ingestionType: data.ingestionType || 'manual_upload', // 'meta_api' | 'manual_upload'
    periodStart,
    periodEnd,
    profileMetrics: {
      followersCount: parseInt(data.profileMetrics?.followersCount ?? 0, 10) || 0,
      followsCount: parseInt(data.profileMetrics?.followsCount ?? 0, 10) || 0,
      mediaCount: normalizedPosts.length,
    },
    postsCount: normalizedPosts.length,
    posts: normalizedPosts,
    createdBy: creatorUserId ? (typeof creatorUserId === 'string' ? new ObjectId(creatorUserId) : creatorUserId) : null,
    createdAt: now,
  };
}
