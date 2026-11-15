// CHORDS: one object per shape, from thick E to thin e (-1=muted, 0=open).
export const chords = [

    {id:'Am',name:'A minor',level:'easy',frets:[-1,0,2,2,1,0],tip:'A reliable first chord. Strum from the A string.'},
    {id:'A',name:'A major',level:'easy',frets:[-1,0,2,2,2,0],tip:'Three fingers on fret 2. Avoid the thick E.'},
    {id:'Dm',name:'D minor',level:'easy',frets:[-1,-1,0,2,3,1],tip:'Play only the highest four strings. Take your time reaching the first fret.'},
    {id:'D',name:'D major',level:'easy',frets:[-1,-1,0,2,3,2],tip:'A small triangle shape on the highest three strings.'},
    {id:'E',name:'E major',level:'easy',frets:[0,2,2,1,0,0],tip:'Use all six strings for a full, ringing sound.'},
    {id:'Em',name:'E minor',level:'easy',frets:[0,2,2,0,0,0],tip:'Only two fingers! Use this to practise clean, even strumming.'},
    {id:'C',name:'C major',level:'easy',frets:[-1,3,2,0,1,0],tip:'A bit of a stretch, but one of the most useful chords.'},
    {id:'G',name:'G major',level:'easy',frets:[3,2,0,0,0,3],tip:'Keep your wrist relaxed as you reach across the neck.'},
    {id:'A7',name:'A dominant seventh',level:'easy',frets:[-1,0,2,0,2,0],tip:'An easy variation of A that adds a bluesy colour.'},
    {id:'D7',name:'D dominant seventh',level:'easy',frets:[-1,-1,0,2,1,2],tip:'A common folk and blues chord.'},
    {id:'E7',name:'E dominant seventh',level:'easy',frets:[0,2,0,1,0,0],tip:'Just two fingers. Try moving between E and E7.'},
    {id:'Fmaj7',name:'F major seventh',level:'easy',frets:[-1,-1,3,2,1,0],tip:'A useful alternative to F in some arrangements. It is not identical to F.'},
    {id:'Bm',name:'B minor',level:'medium',frets:[-1,2,4,4,3,2],barre:{fret:2,from:1,to:5},tip:'A first big challenge: press across the A to high-e strings at fret 2.'},
    {id:'B',name:'B major',level:'medium',frets:[-1,2,4,4,4,2],barre:{fret:2,from:1,to:5},tip:'A barre at fret 2 plus an A-shaped major chord. Take it slowly.'},
    {id:'F',name:'F major',level:'hard',frets:[1,3,3,2,1,1],barre:{fret:1,from:0,to:5},tip:'The famous F barre chord. Small, steady sessions make a difference.'},
    {id:'F#m',name:'F-sharp minor',level:'hard',frets:[2,4,4,2,2,2],barre:{fret:2,from:0,to:5},tip:'Move a minor barre shape to fret 2. Focus on thumb placement and steady pressure.'},
    {id:'Gm',name:'G minor',level:'hard',frets:[3,5,5,3,3,3],barre:{fret:3,from:0,to:5},tip:'The minor barre shape moved to fret 3.'},
    {id:'Cm',name:'C minor',level:'hard',frets:[-1,3,5,5,4,3],barre:{fret:3,from:1,to:5},tip:'An A-minor-shaped barre at fret 3.'},
    {id:'Bb',name:'B-flat major',level:'hard',frets:[-1,1,3,3,3,1],barre:{fret:1,from:1,to:5},tip:'An A-shaped barre chord at fret 1.'},
    {id:'C#m',name:'C-sharp minor',level:'hard',frets:[-1,4,6,6,5,4],barre:{fret:4,from:1,to:5},tip:'Try this after Bm feels comfortable.'}
  ];

export const openNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
export const frequencies = [82.4069, 110, 146.8324, 195.9977, 246.9417, 329.6276];
const chromatic = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

export function noteFor(stringIndex, fret) {
  const open = chromatic.indexOf(openNotes[stringIndex]);
  return chromatic[(open + fret) % 12];
}

export function chordById(id) { return chords.find(chord => chord.id === id); }

// SVG diagrams are generated from fret numbers, not saved as images.
export function diagram(chord) {
  const played = chord.frets.filter(fret => fret > 0);
  const base = chord.frets.includes(0) ? 1 : Math.max(1, Math.min(...played));
  const x = index => 39 + index * 29;
  const y = fret => 42 + 30 * (fret - base + .5);
  let svg = `<svg viewBox="0 0 230 220" role="img" aria-label="${chord.id} guitar chord diagram">`;
  svg += `<text x="15" y="49" font-size="11" fill="#79958e">${base === 1 ? '' : `${base}fr`}</text>`;
  for (let i = 0; i < 6; i++) svg += `<line x1="${x(i)}" y1="43" x2="${x(i)}" y2="193" stroke="#738f8b" stroke-width="${i < 2 ? 2 : 1.3}"/>`;
  for (let fret = 0; fret <= 5; fret++) svg += `<line x1="39" y1="${43 + fret*30}" x2="184" y2="${43+fret*30}" stroke="${fret === 0 && base===1 ? '#144e4a' : '#96aaa5'}" stroke-width="${fret===0&&base===1?5:1.4}"/>`;
  if (chord.barre && chord.barre.fret >= base && chord.barre.fret <= base+4) {
    const barre=chord.barre;
    svg += `<rect x="${x(barre.from)-9}" y="${y(barre.fret)-11}" width="${x(barre.to)-x(barre.from)+18}" height="22" rx="10" fill="#70d5c4" opacity=".85"/>`;
  }
  chord.frets.forEach((fret,index) => {
    if (fret === -1 || fret === 0) svg += `<text x="${x(index)}" y="27" text-anchor="middle" font-size="14" font-weight="bold" fill="${fret===-1?'#9aa6a3':'#078f84'}">${fret===-1?'×':'○'}</text>`;
    else if (fret >= base && fret <= base+4) svg += `<circle cx="${x(index)}" cy="${y(fret)}" r="10.2" fill="#078f84" stroke="#fff" stroke-width="1.5"/>`;
  });
  return svg + '<text x="112" y="211" text-anchor="middle" font-size="10" fill="#90aba4">E     A     D     G     B     e</text></svg>';
}
