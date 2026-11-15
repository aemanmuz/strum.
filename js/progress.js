// PROGRESS & ROADMAP: local-only learner data. No account or server required.
const KEY_V2 = 'strum-with-aeman-v2';
const KEY_V1 = 'strum-with-aeman-v1';

export const phases = [
  {
    span: '1–2', name: 'Start with open chords',
    desc: 'Get used to your guitar and learn the easy chord shapes. Use them in one simple song.',
    tip: 'Yes, your fingertips can hurt at first. With regular practice, calluses form and pressing the strings becomes more comfortable. Give your hands time to adapt, and rest if the pain is sharp or persistent.',
    goals: [['strings','Memorise E A D G B E'],['am-d','Play Am, A, Dm and D cleanly'],['more-open','Practise C, G, E and Em'],['first-song','Try one song using easy chords']]
  },
  {
    span: '3–4', name: 'Learn 2–4 songs',
    desc: 'Keep working with easy chords. Try singing while you change between them.',
    tip: 'Try to sing as you play. Change the chord slowly as each part of the song comes along. Do not worry about tempo yet; focus on getting every chord to sound clean.',
    goals: [['2songs','Learn at least two beginner songs'],['strum','Practise a simple down-up strum'],['4songs','Build a set of up to four easy songs']]
  },
  {
    span: '5–6', name: 'Introduce B and Bm',
    desc: 'Add medium-level chord shapes and mix them with chords you already know.',
    tip: 'Once you can sing and play together, this gets easier. Find a song that uses a medium chord in just one section and practise that change first. Bm was easier for me, so when I was younger I specifically looked for a song that used Bm.',
    goals: [['bm','Practise the Bm shape'],['b','Try B major'],['mix','Change from an open chord into Bm'],['medium-song','Try a song that mixes easy and medium chords']]
  },
  {
    span: '7–10', name: 'Play, sing and record',
    desc: 'Build consistency. Keep learning songs and improve your chord changes and timing.',
    tip: 'Just play, sing, and record your covers. Do not be afraid to post one if you want to. Listen back to old recordings to hear how far your playing has improved. It is about progress, not perfection.',
    goals: [['rhythm','Play along with the metronome'],['songs','Learn two more songs'],['transition','Practise your hardest chord transition'],['record','Record a guitar cover']]
  },
  {
    span: '11+', name: 'Work on barre chords',
    desc: 'Try F and other movable barre shapes regularly. Keep playing songs too.',
    tip: 'Barre chords took me a while. One day I tried them on an electric guitar instead of an acoustic, and I finally played one cleanly. After that, the shape started to feel more natural and I could play it on acoustic too. Once you get a barre chord sounding clean, movable shapes open up loads of new songs.',
    goals: [['f','Try the full F barre chord'],['barres','Practise moving a barre shape'],['full-song','Learn a song that uses a barre chord']]
  }
];

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const fresh = () => ({start: today(), chords: [], songs: [], goals: [], entries: [], practices: [], sheets: {}, customSongs: []});
const isObject = obj => !!obj && typeof obj === 'object' && !Array.isArray(obj);
const limitStrings = (values, cap=500) => Array.isArray(values) ? [...new Set(values.filter(x => typeof x === 'string' && x.length < 150))].slice(0,cap) : [];

// Validate backups and old saved data before letting them into app state.
function normalise(raw) {
  const s = fresh();
  if (!isObject(raw)) return s;
  if (typeof raw.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.start) && !Number.isNaN(Date.parse(raw.start))) s.start = raw.start;
  for (const key of ['chords','songs','goals','practices']) s[key] = limitStrings(raw[key]);
  s.entries = Array.isArray(raw.entries) ? raw.entries.filter(isObject).slice(-400).map(entry => ({
    id: String(entry.id ?? '').slice(0,90), date: String(entry.date ?? '').slice(0,30),
    mood: String(entry.mood ?? '').slice(0,100), text: String(entry.text ?? '').slice(0,4000)
  })) : [];
  s.sheets = {};
  if (isObject(raw.sheets)) {
    for (const [key,text] of Object.entries(raw.sheets).slice(0,250)) {
      if (key.length < 150 && typeof text === 'string') s.sheets[key] = text.slice(0,40000);
    }
  }
  s.customSongs = Array.isArray(raw.customSongs) ? raw.customSongs.filter(isObject).slice(0,200).map(song => ({
    id: String(song.id || '').slice(0,90), title: String(song.title || '').slice(0,120),
    artist: String(song.artist || '').slice(0,120), region: ['English','Malaysian','Indonesian','Other'].includes(song.region) ? song.region : 'Other',
    level: ['easy','medium','hard'].includes(song.level) ? song.level : 'easy',
    seq: limitStrings(song.seq,24), sheet: String(song.sheet || '').slice(0,40000),
    tip: String(song.tip || '').slice(0,240), url: String(song.url || '').slice(0,500),
    strum: 'Practise at your own tempo', mine: true
  })).filter(song => song.id.startsWith('custom-') && song.title && song.sheet) : [];
  return s;
}

function load() {
  try {
    const newData = localStorage.getItem(KEY_V2);
    if (newData) return normalise(JSON.parse(newData));
    // Automatically read existing V1 data when upgrading on the SAME website origin.
    const oldData = localStorage.getItem(KEY_V1);
    if (oldData) return normalise(JSON.parse(oldData));
  } catch (error) { console.warn('Could not load saved progress:', error); }
  return fresh();
}
export let state = load();

export function saveProgress() {
  try { localStorage.setItem(KEY_V2, JSON.stringify(state)); return true; }
  catch (error) { console.warn('Local browser storage failed:',error); return false; }
}
export function score() {
  return state.chords.length*10 + state.songs.length*25 + state.goals.length*15 + state.entries.length*5 + state.practices.length*8;
}
export function weekNumber() {
  const start = new Date(`${state.start}T12:00:00`);
  const now = new Date();
  const midday = new Date(now.getFullYear(), now.getMonth(), now.getDate(),12);
  return Math.floor(Math.max(0, Math.floor((midday-start)/86400000))/7)+1;
}
export function currentPhase() {
  const w = weekNumber();
  return w <= 2 ? 0 : w <= 4 ? 1 : w <= 6 ? 2 : w <= 10 ? 3 : 4;
}
export function toggle(list,id) {
  if (!['chords','songs','goals'].includes(list)) return false;
  const index=state[list].indexOf(id);
  if (index >= 0) state[list].splice(index,1);
  else state[list].push(id);
  return saveProgress();
}
export function putSong(song) {
  const index = state.customSongs.findIndex(item => item.id===song.id);
  if (index < 0 && state.customSongs.length>=200) throw new Error('You have reached the 200-song local limit. Export a backup first.');
  if (index < 0) state.customSongs.unshift(song);
  else state.customSongs[index] = song;
  return saveProgress();
}
export function removeSong(id) {
  state.customSongs = state.customSongs.filter(song => song.id !== id);
  state.songs=state.songs.filter(songId => songId!==id);
  delete state.sheets[id];
  return saveProgress();
}
export function exportBackup() {
  return JSON.stringify({app:'strum-guitar',version:2,exportedAt:new Date().toISOString(),data:state},null,2);
}
export function restoreBackup(json) {
  const doc = JSON.parse(json);
  if (!isObject(doc) || doc.app!=='strum-guitar' || doc.version!==2 || !isObject(doc.data)) throw new Error('This is not a Strum V2 backup file.');
  const candidate=normalise(doc.data);
  const previous=state;
  state=candidate;
  if (!saveProgress()) { state=previous; throw new Error('Browser storage is unavailable or full. No data was replaced.'); }
}
