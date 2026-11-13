// How WaveCue plays clips and opens YouTube. Flip these if in-app playback causes problems.
//
// CLIP_PLAYBACK
//   'in-app'      Clips play inside WaveCue in YouTube's embedded player: starts at the clip's
//                 start, stops at its end, Replay, and an "Open in YouTube" backup. (current)
//                 Some channels disable embedding; those videos show the backup button instead.
//   'youtube-app' The play button opens the YouTube app at the clip's start time (the original
//                 behaviour). If YouTube already has that video open it may ignore the start
//                 time, so pair this with YOUTUBE_LINK_STYLE = 'web' ("plan A").
//
// YOUTUBE_LINK_STYLE (used by every "open in YouTube" action, including the backup button)
//   'app-scheme'  vnd.youtube://VIDEO?t=SECONDS  (current)
//   'web'         https://www.youtube.com/watch?v=VIDEO&t=SECONDSs - still opens the YouTube
//                 app when installed, and tends to respect the start time more reliably.
//
// Plan A = CLIP_PLAYBACK: 'youtube-app' + YOUTUBE_LINK_STYLE: 'web'.
// The last version before in-app playback is tagged in git as `before-in-app-player`.

export const CLIP_PLAYBACK = 'in-app';
export const YOUTUBE_LINK_STYLE = 'app-scheme';
