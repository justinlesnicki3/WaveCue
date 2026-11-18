// youtubeService.js
import axios from 'axios';
import { YOUTUBE_API_KEY } from '@env';

const API_KEY = YOUTUBE_API_KEY;
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

// Skip uploads from channels smaller than this (filters out most fan re-uploads)
const MIN_CHANNEL_SUBSCRIBERS = 100;

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
          'items(id,contentDetails/duration,snippet(title,channelId,channelTitle,publishedAt,liveBroadcastContent,thumbnails(high,medium,default)))',
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
      if (isLiveOrUpcoming(video)) {
        console.log('!! Skipped (live now / upcoming):', title);
        return false;
      }
      return duration >= 50 && isLikelySet(title, channel, djName);
    });

    // Drop uploads from tiny channels (mostly fan re-uploads). One batched request.
    const subscribers = await fetchSubscriberCounts(
      longSets.map(v => v.snippet?.channelId),
      signal
    );
    const fromRealChannels = longSets.filter(video => {
      const count = subscribers.get(video.snippet?.channelId);
      // undefined = channel hides its count (or wasn't returned); give it the benefit of the doubt
      if (count !== undefined && count < MIN_CHANNEL_SUBSCRIBERS) {
        console.log(`!! Skipped (channel has ${count} subscribers):`, video.snippet?.title);
        return false;
      }
      return true;
    });

    return fromRealChannels.map(video => ({
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

// Live right now, or scheduled to go live. Recordings of past livestreams are fine:
// plenty of real sets are streamed live by the venue/festival channel first.
const isLiveOrUpcoming = video => {
  const status = video.snippet?.liveBroadcastContent;
  return status === 'live' || status === 'upcoming';
};

// Map of channelId -> subscriber count. Channels that hide their count are left out.
const fetchSubscriberCounts = async (channelIds, signal) => {
  const ids = [...new Set(channelIds.filter(Boolean))];
  const counts = new Map();

  // the API accepts up to 50 ids per request
  for (let i = 0; i < ids.length; i += 50) {
    const { data } = await axios.get(CHANNELS_URL, {
      signal,
      params: {
        part: 'statistics',
        id: ids.slice(i, i + 50).join(','),
        key: API_KEY,
        fields: 'items(id,statistics(subscriberCount,hiddenSubscriberCount))',
      },
    });
    for (const ch of data.items || []) {
      if (ch.statistics?.hiddenSubscriberCount) continue;
      const n = Number(ch.statistics?.subscriberCount);
      if (Number.isFinite(n)) counts.set(ch.id, n);
    }
  }
  return counts;
};

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
  'fan made',
  'ufo',
  'what',
  'overwatch',
  'treatment',
  'opioid',
  'cubano',
  'mashup',
  'tech house',
  'techhouse',
  'workout',
  '+', // fan-made mashups ("Artist A + Artist B")
  '＋', // full-width plus, same thing
];

// Blocked as whole words only, any capitalization, so they don't hit longer words that
// happen to contain them (e.g. "style" must not block the artist Max Styler).
const blockedArtists = ['guu'];
const blockedWholeWords = ['style', 'styles'];
const wholeWordPattern = (words) =>
  new RegExp(`(^|[^a-z0-9])(${words.join('|')})(?=$|[^a-z0-9])`, 'i');
const blockedArtistPattern = wholeWordPattern(blockedArtists);
const blockedWordPattern = wholeWordPattern(blockedWholeWords);

// Emoji anywhere in the title (mostly fan / AI "style" compilations): pictographs,
// faces, flags, symbols & dingbats, and the emoji presentation selector (e.g. ☀️)
const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

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
  const hasBlacklisted =
    blacklist.some(b => lowerTitle.includes(b)) || blockedWordPattern.test(title || '');
  const hasBlockedArtist = blockedArtistPattern.test(title || '');
  const hasEmoji = emojiPattern.test(title || '');

  if (!hasDJName) console.log('!! Skipped (no DJ name):', title);
  else if (!hasSetKeyword) console.log('!! Skipped (no keyword):', title);
  else if (hasBlacklisted) console.log('!! Skipped (blacklisted):', title);
  else if (hasBlockedArtist) console.log('!! Skipped (blocked artist):', title);
  else if (hasEmoji) console.log('!! Skipped (emoji in title):', title);

  return hasDJName && hasSetKeyword && !hasBlacklisted && !hasBlockedArtist && !hasEmoji;
};

const parseISO8601Duration = duration => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || '0', 10);
  const minutes = parseInt(match?.[2] || '0', 10);
  const seconds = parseInt(match?.[3] || '0', 10);
  return Math.round(hours * 60 + minutes + seconds / 60);
};
