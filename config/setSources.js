// Big festival / label / media channels that post DJ sets. New Sets reads each one's recent
// uploads and picks out sets by DJs you follow, so a festival upload (e.g. John Summit at
// Lollapalooza) is found even when a DJ's name is flooded with fan uploads on YouTube.
// Reading a channel's uploads is cheap (1 YouTube quota unit per 50 videos).
//
// To add one: find the channel's id (starts with "UC") and add a line below.
// Channel ids looked up 2026-11-17.
export const SET_SOURCE_CHANNELS = [
  // festivals
  { name: 'Lollapalooza', channelId: 'UC-QVOEJcRTmqXTEwUFbPRLA' },
  { name: 'Tomorrowland', channelId: 'UCsN8M73DMWa8SPp5o_0IAQQ' },
  { name: 'Coachella', channelId: 'UCHF66aWLOxBW4l6VkSrS3cQ' },
  { name: 'Ultra (UMF TV)', channelId: 'UCX9fOfRkHANZM8iFWhMSpNg' },
  { name: 'Insomniac (EDC)', channelId: 'UCr45VhwCBYwMfdN-gz7W_OA' },
  { name: 'Creamfields', channelId: 'UC7RZ3YtxzlR61_3kfjdolAA' },
  { name: 'Movement Detroit', channelId: 'UCnf2atji58GrDey0R4AOKVg' },
  { name: 'Breakaway', channelId: 'UC5ROL0O__ksSFoPmJh0Ct1g' },
  { name: 'Amsterdam Dance Event', channelId: 'UCJ2RRwUFwr2iKTJWRl-D6dA' },
  // set series & media
  { name: 'Cercle', channelId: 'UCPKT_csvP72boVX0XrMtagQ' },
  { name: 'Boiler Room', channelId: 'UCGBpxWJr9FNOcFYA5GkKrMg' },
  { name: 'HÖR Berlin', channelId: 'UCmfF7JZv26UUKyRedViGIlw' },
  { name: 'Mixmag', channelId: 'UCQdCIrTpkhEH5Z8KPsn7NvQ' },
  { name: 'DJ Mag', channelId: 'UCJEKlziKdxoos1qbptjGgLg' },
  { name: 'Beatport', channelId: 'UCyEMqKQPGdj8wKVKt2-agbQ' },
  // labels & clubs
  { name: 'Defected', channelId: 'UCnOxaDXBiBXg9Nn9hKWu6aw' },
  { name: 'Dirtybird', channelId: 'UCD7UAd18FFkcJ22wxNNwq7A' },
  { name: 'Ministry of Sound', channelId: 'UC8T81Q-rEobLa-YuQKj8L1A' },
  { name: 'Club Space Miami', channelId: 'UCD2yZhDoieQ4TP5xKeRft-g' },
  { name: 'Ushuaïa Ibiza', channelId: 'UCgE_8JCb1dsweUxuCOW96Pg' },
  { name: 'elrow', channelId: 'UCDxMwHtvoQ2WzfgbpHdN5dQ' },
];
