// youtubeService.js
import axios from 'axios';
import { YOUTUBE_API_KEY } from '@env';

const API_KEY = YOUTUBE_API_KEY;
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';
const PLAYLIST_ITEMS_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

// Skip uploads from channels smaller than this (filters out most fan re-uploads)
const MIN_CHANNEL_SUBSCRIBERS = 100;

// Public entry
// options.publishedAfter: ISO date string; only return videos published after it
// options.order: YouTube sort order, e.g. 'date' for newest first (default: relevance)
// options.videoDuration: YouTube length filter, e.g. 'long' (over 20 min) so short uploads
//   (tracks, lyric videos, clips) don't use up the limited number of results
// options.excludeTerms: words YouTube should leave out of the results (e.g. ['style']), so
//   spam uploads don't use up the limited number of results
// options.throwOnError: rethrow request failures instead of returning [] (so callers can
//   tell "no results" apart from "request failed")
export const searchDJSets = async (djName, options = {}) => {
  const {
    signal,
    publishedAfter,
    order,
    videoDuration,
    excludeTerms = [],
    throwOnError = false,
  } = options;
  // YouTube search understands "-word" as "without this word"
  const query = [djName, ...excludeTerms.map((t) => `-${t}`)].join(' ');

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
          q: query,
          type: 'video',
          maxResults: 25,
          publishedAfter,
          order,
          videoDuration,
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

    const videoIds = [...new Set(searchResults.map((i) => i?.id?.videoId).filter(Boolean))];
    return await videosToSets(videoIds, djName, { signal });
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

// Sets the DJ uploaded to their own official channel since publishedAfter.
// Popular DJs get so many fan uploads, lyric videos and AI "style" mixes that a general
// search can't reach back far enough; reading the channel's uploads list directly is
// reliable, and costs 1 quota unit per 50 videos instead of 100 per search.
export const fetchChannelSets = async (channelId, djName, options = {}) => {
  const { signal, publishedAfter, throwOnError = false } = options;
  if (!API_KEY || !channelId) return [];

  try {
    // every channel's uploads playlist id is its channel id with "UC" swapped for "UU"
    const uploadsPlaylist = 'UU' + channelId.slice(2);
    const after = publishedAfter ? new Date(publishedAfter).getTime() : 0;
    const videoIds = [];
    let pageToken = null;

    for (let page = 0; page < 2; page++) {
      const { data } = await axios.get(PLAYLIST_ITEMS_URL, {
        signal,
        params: {
          part: 'contentDetails',
          playlistId: uploadsPlaylist,
          maxResults: 50,
          pageToken,
          key: API_KEY,
          fields: 'items(contentDetails(videoId,videoPublishedAt)),nextPageToken',
        },
      });

      let reachedOlder = false;
      for (const item of data.items || []) {
        const id = item.contentDetails?.videoId;
        const published = new Date(item.contentDetails?.videoPublishedAt).getTime();
        if (after && published < after) {
          reachedOlder = true;
          continue;
        }
        if (id) videoIds.push(id);
      }

      pageToken = data.nextPageToken;
      // uploads are listed newest first, so once we pass the cutoff there's nothing newer left
      if (!pageToken || reachedOlder) break;
    }

    return await videosToSets([...new Set(videoIds)], djName, { signal, officialChannel: true });
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn('!!! YouTube API request was aborted');
    } else {
      console.error('YouTube channel uploads error:', error.response?.data || error.message);
    }
    if (throwOnError) throw error;
    return [];
  }
};

// Sets by any of the given DJs posted since publishedAfter on the big festival / label /
// media channels in config/setSources.js. Each channel's uploads list is read once (not
// once per DJ) and titles are matched against every DJ name.
// Returns a Map: DJ name (as given) -> sets.
export const fetchSourceChannelSets = async (channels, djNames, options = {}) => {
  const { signal, publishedAfter } = options;
  const found = new Map();
  if (!API_KEY || !channels?.length || !djNames?.length) return found;

  const after = publishedAfter ? new Date(publishedAfter).getTime() : 0;
  // whole-name match, any capitalization ("FISHER" shouldn't match "fisherman")
  const matchers = djNames.map((name) => ({ name, pattern: nameInTitlePattern(name) }));

  // read every channel's recent uploads in parallel; one failing channel doesn't stop the rest
  const uploads = await Promise.allSettled(
    channels.map((c) => recentUploads(c.channelId, after, signal))
  );

  // DJ name -> ids of uploads whose title mentions that DJ
  const idsByDj = new Map();
  uploads.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`!! Couldn't read ${channels[i].name} uploads:`, result.reason?.message);
      return;
    }
    for (const video of result.value) {
      for (const { name, pattern } of matchers) {
        if (!pattern.test(video.title)) continue;
        if (!idsByDj.has(name)) idsByDj.set(name, []);
        idsByDj.get(name).push(video.id);
      }
    }
  });

  // run the usual set filters (length, keywords, blacklist...) for each DJ's matches
  for (const [name, ids] of idsByDj) {
    try {
      found.set(name, await videosToSets([...new Set(ids)], name, { signal }));
    } catch (error) {
      console.warn(`!! Couldn't check festival uploads for ${name}:`, error?.message);
    }
  }
  return found;
};

// A channel's uploads published after `after` (ms), newest first: [{ id, title }].
// Reads up to 4 pages of 50, stopping as soon as it passes the cutoff.
const recentUploads = async (channelId, after, signal) => {
  const uploadsPlaylist = 'UU' + channelId.slice(2);
  const videos = [];
  let pageToken = null;

  for (let page = 0; page < 4; page++) {
    const { data } = await axios.get(PLAYLIST_ITEMS_URL, {
      signal,
      params: {
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylist,
        maxResults: 50,
        pageToken,
        key: API_KEY,
        fields: 'items(snippet/title,contentDetails(videoId,videoPublishedAt)),nextPageToken',
      },
    });

    let reachedOlder = false;
    for (const item of data.items || []) {
      const id = item.contentDetails?.videoId;
      const published = new Date(item.contentDetails?.videoPublishedAt).getTime();
      if (after && published < after) {
        reachedOlder = true;
        continue;
      }
      if (id) videos.push({ id, title: item.snippet?.title || '' });
    }

    pageToken = data.nextPageToken;
    if (!pageToken || reachedOlder) break;
  }
  return videos;
};

// Regex that finds a DJ name as a whole name inside a title, any capitalization
const nameInTitlePattern = (name) => {
  const escaped = (name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i');
};

// Looks up video details and keeps only the ones that look like real DJ sets.
// officialChannel: the videos come from the DJ's own channel, so skip the "is the DJ's
// name in the title" and small-channel checks (every other filter still applies).
const videosToSets = async (videoIds, djName, { signal, officialChannel = false } = {}) => {
  if (!videoIds.length) return [];

  const details = [];
  // the API accepts up to 50 ids per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const { data } = await axios.get(VIDEO_DETAILS_URL, {
      signal,
      params: {
        part: 'contentDetails,snippet',
        id: videoIds.slice(i, i + 50).join(','),
        key: API_KEY,
        fields:
          'items(id,contentDetails/duration,snippet(title,channelId,channelTitle,publishedAt,liveBroadcastContent,thumbnails(high,medium,default)))',
      },
    });
    details.push(...(data.items || []));
  }

  const uniqueDetailsMap = new Map();
  for (const v of details) {
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
    return duration >= 50 && isLikelySet(title, channel, djName, { officialChannel });
  });

  // Drop uploads from tiny channels (mostly fan re-uploads). One batched request.
  let fromRealChannels = longSets;
  if (!officialChannel) {
    const subscribers = await fetchSubscriberCounts(
      longSets.map(v => v.snippet?.channelId),
      signal
    );
    fromRealChannels = longSets.filter(video => {
      const count = subscribers.get(video.snippet?.channelId);
      // undefined = channel hides its count (or wasn't returned); give it the benefit of the doubt
      if (count !== undefined && count < MIN_CHANNEL_SUBSCRIBERS) {
        console.log(`!! Skipped (channel has ${count} subscribers):`, video.snippet?.title);
        return false;
      }
      return true;
    });
  }

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

const isLikelySet = (title, channelTitle, djName, { officialChannel = false } = {}) => {
  const lowerTitle = (title || '').toLowerCase();
  const lowerChannel = (channelTitle || '').toLowerCase();
  const lowerDJName = (djName || '').toLowerCase();

  const hasDJName =
    officialChannel || lowerTitle.includes(lowerDJName) || lowerChannel.includes(lowerDJName);
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
