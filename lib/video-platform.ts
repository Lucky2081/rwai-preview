const BILIBILI_HOST_PATTERN = /(^|\.)bilibili\.com$/i;
const B23_HOST_PATTERN = /(^|\.)b23\.tv$/i;
const YOUTUBE_HOST_PATTERN = /(^|\.)youtube\.com$/i;
const YOUTU_BE_HOST_PATTERN = /(^|\.)youtu\.be$/i;
const YOUTUBE_NOCOOKIE_HOST_PATTERN = /(^|\.)youtube-nocookie\.com$/i;

function parseUrl(rawUrl: string): URL | null {
  if (!rawUrl) return null;
  const input = rawUrl.trim();
  if (!input) return null;

  try {
    return new URL(input);
  } catch {
    try {
      return new URL(`https://${input}`);
    } catch {
      return null;
    }
  }
}

export function isBilibiliUrl(rawUrl: string): boolean {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return false;
  return BILIBILI_HOST_PATTERN.test(parsed.hostname) || B23_HOST_PATTERN.test(parsed.hostname);
}

export function getBilibiliEmbedUrl(rawUrl: string): string | null {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return null;

  const hostname = parsed.hostname;
  if (!BILIBILI_HOST_PATTERN.test(hostname) && !B23_HOST_PATTERN.test(hostname)) {
    return null;
  }

  if (hostname === 'player.bilibili.com') {
    parsed.searchParams.set('autoplay', '1');
    parsed.searchParams.set('muted', '1');
    return parsed.toString();
  }

  const bvidFromQuery = parsed.searchParams.get('bvid')?.trim();
  const aidFromQuery = parsed.searchParams.get('aid')?.trim();
  const page = parsed.searchParams.get('p')?.trim() || '1';

  const pathBvidMatch = parsed.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/i);
  const pathAidMatch = parsed.pathname.match(/\/video\/av(\d+)/i);

  const bvid = bvidFromQuery || (pathBvidMatch ? pathBvidMatch[1] : '');
  const aid = aidFromQuery || (pathAidMatch ? pathAidMatch[1] : '');

  if (bvid) {
    return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&page=${encodeURIComponent(page)}&high_quality=1&as_wide=1&autoplay=1&muted=1`;
  }

  if (aid) {
    return `https://player.bilibili.com/player.html?aid=${encodeURIComponent(aid)}&page=${encodeURIComponent(page)}&high_quality=1&as_wide=1&autoplay=1&muted=1`;
  }

  return null;
}

export function isYouTubeUrl(rawUrl: string): boolean {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return false;

  return (
    YOUTUBE_HOST_PATTERN.test(parsed.hostname) ||
    YOUTU_BE_HOST_PATTERN.test(parsed.hostname) ||
    YOUTUBE_NOCOOKIE_HOST_PATTERN.test(parsed.hostname)
  );
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return null;

  const hostname = parsed.hostname.toLowerCase();
  if (
    !YOUTUBE_HOST_PATTERN.test(hostname) &&
    !YOUTU_BE_HOST_PATTERN.test(hostname) &&
    !YOUTUBE_NOCOOKIE_HOST_PATTERN.test(hostname)
  ) {
    return null;
  }

  let videoId = '';
  let start = parsed.searchParams.get('t')?.trim() || parsed.searchParams.get('start')?.trim() || '';

  if (YOUTU_BE_HOST_PATTERN.test(hostname)) {
    videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
  } else {
    const path = parsed.pathname;
    const watchId = parsed.searchParams.get('v')?.trim();
    const embedMatch = path.match(/^\/embed\/([^/?#]+)/i);
    const shortsMatch = path.match(/^\/shorts\/([^/?#]+)/i);
    const liveMatch = path.match(/^\/live\/([^/?#]+)/i);

    videoId = watchId || embedMatch?.[1] || shortsMatch?.[1] || liveMatch?.[1] || '';
  }

  if (!videoId) return null;

  if (/^\d+s$/i.test(start)) {
    start = start.slice(0, -1);
  }
  if (start && !/^\d+$/.test(start)) {
    start = '';
  }

  const embedUrl = new URL(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`);
  embedUrl.searchParams.set('autoplay', '1');
  embedUrl.searchParams.set('mute', '1');
  embedUrl.searchParams.set('playsinline', '1');
  embedUrl.searchParams.set('rel', '0');
  embedUrl.searchParams.set('modestbranding', '1');
  if (start) {
    embedUrl.searchParams.set('start', start);
  }

  return embedUrl.toString();
}
