// youtubeService.js
import axios from 'axios';
import { YOUTUBE_API_KEY } from '@env';

const API_KEY = YOUTUBE_API_KEY;
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Public entry
// options.publishedAfter: ISO date string; only return videos published after it
// options.order: YouTube sort order, e.g. 'date' for newest first (default: relevance)
// options.throwOnError: rethrow request failures instead of returning [] (so callers can
//   tell "no results" apart from "request failed")
export const searchDJSets = async (djName, options = {}) => {
  const { signal, publishedAfter, order, throwOnError = false } = options;

  if (!API_KEY) {
    console.error('!! YOUTUBE_API_KEY is missing');
    return [];
  }

  try {
    const searchResults = [];
    let nextPageToken = null;
    let pageCount = 0;

    while (pageCount < 2) {
      const { data } = await axios.get(SEARCH_URL, {
        signal,
        params: {
          part: 'snippet',
          q: djName,
          type: 'video',
          maxResults: 25,
          publishedAfter,
          order,
          pageToken: nextPageToken,
          key: API_KEY,
          fields: 'items(id/videoId,snippet(title,channelTitle,publishedAt,thumbnails/high/url)),nextPageToken',
        },
      });

      searchResults.push(...(data.items || []));
      nextPageToken = data.nextPageToken;
      pageCount += 1;

      if (!nextPageToken) break;
    }

    const idSet = new Set();
    const uniqueSearchResults = [];
    for (const item of searchResults) {
      const vid = item?.id?.videoId;
      if (vid && !idSet.has(vid)) {
        idSet.add(vid);
        uniqueSearchResults.push(item);
      }
    }

    const videoIds = uniqueSearchResults.map(i => i.id.videoId).join(',');
    if (!videoIds) return [];

    const { data: detailsData } = await axios.get(VIDEO_DETAILS_URL, {
      signal,
      params: {
        part: 'contentDetails,snippet',
        id: videoIds,
        key: API_KEY,
        fields:
          'items(id,contentDetails/duration,snippet(title,channelTitle,publishedAt,thumbnails(high,medium,default)))',
      },
    });

    const uniqueDetailsMap = new Map();
    for (const v of detailsData.items || []) {
      if (!uniqueDetailsMap.has(v.id)) uniqueDetailsMap.set(v.id, v);
    }
    const uniqueDetails = Array.from(uniqueDetailsMap.values());

    const longSets = uniqueDetails.filter(video => {
      const duration = parseISO8601Duration(video.contentDetails?.duration);
      const title = video.snippet?.title || '';
      const channel = video.snippet?.channelTitle || '';
      return duration >= 50 && isLikelySet(title, channel, djName);
    });

    return longSets.map(video => ({
      id: video.id, 
      videoId: video.id,
      title: video.snippet.title,
      thumbnail:
        video.snippet.thumbnails?.high?.url ||
        video.snippet.thumbnails?.medium?.url ||
        video.snippet.thumbnails?.default?.url ||
        null,
      publishDate: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle,
    }));
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn('!!! YouTube API request was aborted');
    } else {
      console.error('YouTube API error:', error.response?.data || error.message);
    }
    if (throwOnError) throw error;
    return [];
  }
};

/* ----------------------- helpers ----------------------- */

const blacklist = [
  'interview',
  'reaction',
  'review',
  'recap',
  'trailer',
  'announcement',
  'podcast',
  'qa',
  'q&a',
  'tutorial',
  'shorts',
  'behind the scenes',
  'preview',
  'ufo',
  'what',
];

const setKeywords = [
    '@',
  'live',
  'set',
  'dj',
  'boiler room',
  'cercle',
  'essential mix',
  'festival',
  'mix',
  'b2b',
  'tomorrowland',
  'edc',
  'coachella',
  'ultra',
  'live stream',
  'concert',
  'performance',
  'closing set',
  'opening set',
  'club',
  'mirage',
  'greenvalley',
  'culture shock',
  'live at',
  'main stage',
  'afterparty',
  'burning man',
  'fabric',
  'mixmag',
  'stream',
  'live mix',
  'club space',
  'ushuaïa',
  'paralelo',
  'sunwaves',
  'at',
];

const isLikelySet = (title, channelTitle, djName) => {
  const lowerTitle = (title || '').toLowerCase();
  const lowerChannel = (channelTitle || '').toLowerCase();
  const lowerDJName = (djName || '').toLowerCase();

  const hasDJName =
    lowerTitle.includes(lowerDJName) || lowerChannel.includes(lowerDJName);
  const hasSetKeyword = setKeywords.some(k => lowerTitle.includes(k));
  const hasBlacklisted = blacklist.some(b => lowerTitle.includes(b));

  if (!hasDJName) console.log('!! Skipped (no DJ name):', title);
  else if (!hasSetKeyword) console.log('!! Skipped (no keyword):', title);
  else if (hasBlacklisted) console.log('!! Skipped (blacklisted):', title);

  return hasDJName && hasSetKeyword && !hasBlacklisted;
};

const parseISO8601Duration = duration => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || '0', 10);
  const minutes = parseInt(match?.[2] || '0', 10);
  const seconds = parseInt(match?.[3] || '0', 10);
  return Math.round(hours * 60 + minutes + seconds / 60);
};
