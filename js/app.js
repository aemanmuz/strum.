// APP: connects HTML controls with chords, songs, audio and saved progress.
// Run with VS Code Live Server or GitHub Pages (ES modules do not work reliably via file://).
import { chords, openNotes, frequencies, noteFor, diagram, chordById } from './chords.js';
import { builtInSongs, parseChords, escapeHTML, renderSheet } from './songs.js';
import { phases, today, state, saveProgress, score, weekNumber, currentPhase, toggle, putSong, removeSong, exportBackup, restoreBackup } from './progress.js';
import { playNote, playChord, playChordLoop, Metronome } from './audio.js';

const $ = (selector,scope=document) => scope.querySelector(selector);
const $$ = (selector,scope=document) => [...scope.querySelectorAll(selector)];
let selectedChord = 'Am';
let chordFilter = 'all';
let selectedSong = 'morning';
let toastTimeout;
const availableViews = ['home','basics','chords','songs','metronome','plan','journal'];
const allSongs = () => [...state.customSongs, ...builtInSongs];
const findSong = id => allSongs().find(song=>song.id===id);
const hasCustom = song => !!song?.mine;
const safeURL = value => {
  try { const u=new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; }
  catch { return ''; }
};
const shownDate = date => date || today();

function toast(message){
  const el=$('#toast');el.textContent=message;
  el.classList.add('show');clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>el.classList.remove('show'),2800);
}
function celebrate(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  for(let i=0;i<10;i++){
    const dot=document.createElement('i');dot.className='confetti';
    dot.style.left=`${50+Math.random()*10-5}vw`;dot.style.top='42vh';
    dot.style.background=['#078d83','#76d4c5','#c2ede4'][i%3];
    dot.style.setProperty('--tx',`${Math.random()*450-225}px`);
    dot.style.setProperty('--ty',`${Math.random()*260-130}px`);
    document.body.append(dot);setTimeout(()=>dot.remove(),1000);
  }
}
function updateStats(){
  const points=score();
  $('#topPoints').textContent=points;
  $('#statPoints').textContent=points;
  $('#statChords').textContent=state.chords.length;
  $('#statSongs').textContent=state.songs.length;
  $('#statWeeks').textContent=weekNumber();
  const chapter=phases[currentPhase()];
  const completed=chapter.goals.filter(([id])=>state.goals.includes(id)).length;
  $('#chapterTitle').textContent=chapter.name;
  $('#chapterDesc').textContent=chapter.desc;
  $('#chapterBar').style.width=`${100*completed/chapter.goals.length}%`;
  $('#chapterProgress').textContent=`${completed} of ${chapter.goals.length} goals completed`;
  const practised=state.practices.includes(today());
  $('#practiceBtn').disabled=practised;
  $('#practiceBtn').textContent=practised?'Practice logged today ✓':'Log today’s practice · +8 pts';
  $('#practiceStatus').textContent=practised?'Today’s session has been recorded.':'';
  const milestones=[
    {p:40,title:'First session',desc:'You have started building your skill.'},
    {p:120,title:'Chord builder',desc:'Keep sharpening those chord changes.'},
    {p:300,title:'Song collector',desc:'You are building a proper repertoire.'},
    {p:600,title:'Consistent player',desc:'Your practice sessions are adding up.'}
  ];
  const next=milestones.find(m=>points<m.p);
  $('#achievementBar').style.width=next?`${Math.min(100,points/next.p*100)}%`:'100%';
  $('#achievementProgress').textContent=next?`${points} / ${next.p} points to ${next.title}`:`${points} points · All milestones unlocked`;
  $('#achievements').innerHTML=milestones.map(m=>`<div class="achievement"><div class="seal">${points>=m.p?'🏅':'🔒'}</div><div><h4>${escapeHTML(m.title)}</h4><small>${points>=m.p?escapeHTML(m.desc):`Unlock at ${m.p} points`}</small></div></div>`).join('');
}
function go(view){
  if(!availableViews.includes(view))return;
  $$('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
  $$('.nav [data-go]').forEach(el=>{
    el.classList.toggle('active',el.dataset.go===view);
    if(el.dataset.go===view)el.setAttribute('aria-current','page');
    else el.removeAttribute('aria-current');
  });
  if(view==='chords')renderChords();
  if(view==='songs')renderSongs();
  if(view==='plan')renderPlan();
  if(view==='journal')renderJournal();
  if(view==='metronome')renderMetroBeats(-1);
  window.scrollTo({top:0,behavior:'smooth'});
  history.replaceState(null,'',`#${view}`);
}
function renderStrings(){
  const labels=['6th · Low E','5th · A','4th · D','3rd · G','2nd · B','1st · High e'];
  $('#openStrings').innerHTML=openNotes.map((note,index)=>`<button class="string-btn" data-open="${index}" aria-label="Play ${labels[index]}"><b>${index===5?'e':note}</b><small>${labels[index]}</small></button>`).join('');
}
function renderFrets(){
  const head='<div class="fret-head">'+Array.from({length:13},(_,i)=>`<span>${i===0?'OPEN':i}</span>`).join('')+'</div>';
  const rows=openNotes.map((_,i)=>`<div class="fret-row">${Array.from({length:13},(_,f)=>`<button class="fret-cell" data-string="${i}" data-fret="${f}" aria-label="String ${6-i}, fret ${f}, note ${noteFor(i,f)}"><span>${noteFor(i,f)}</span></button>`).join('')}</div>`).join('');
  $('#fretboard').innerHTML=head+`<div class="fret-rows">${rows}</div>`;
}
function renderChords(){
  $$('#view-chords [data-chord-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.chordFilter===chordFilter));
  const visible=chords.filter(chord=>chordFilter==='all'||chord.level===chordFilter);
  if(!visible.some(chord=>chord.id===selectedChord))selectedChord=visible[0]?.id||'Am';
  $('#chordGrid').innerHTML=visible.map(c=>`<button class="chord-tile ${c.id===selectedChord?'active':''}" data-chord="${escapeHTML(c.id)}"><span class="level ${c.level}">${c.level}</span><strong>${escapeHTML(c.id)}</strong><p>${escapeHTML(c.name)}</p>${state.chords.includes(c.id)?'<p class="mastered-label">✓ Mastered</p>':''}</button>`).join('');
  const c=chordById(selectedChord);
  $('#chordDetail').innerHTML=`<div class="eyebrow">CHORD DETAIL</div><h3>${escapeHTML(c.id)} <span class="detail-subtitle">${escapeHTML(c.name)}</span></h3><span class="level ${c.level}">${c.level}</span><div class="diagram">${diagram(c)}</div><p class="chord-note">${escapeHTML(c.tip)}</p><div class="detail-actions"><button class="btn small" data-hear="${c.id}">♫ Hear chord</button><button class="btn small ${state.chords.includes(c.id)?'secondary':''}" data-master="${c.id}">${state.chords.includes(c.id)?'✓ Mastered · Undo':'Mark mastered · +10 pts'}</button></div><p class="tiny muted detail-hint">Check each string individually. If a note buzzes, adjust your finger pressure and position behind the fret.</p>`;
}
const languageCode={English:'EN',Malaysian:'MY',Indonesian:'ID',Original:'OR',Other:'OT'};
function filteredSongs(){
  const query=$('#songSearch').value.trim().toLowerCase();
  const region=$('#songRegion').value;
  const level=$('#songLevel').value;
  const source=$('#songSource').value;
  return allSongs().filter(song=>{
    if(region!=='all' && song.region!==region)return false;
    if(level!=='all' && song.level!==level)return false;
    if(source==='mine' && !hasCustom(song))return false;
    if(source==='built-in' && hasCustom(song))return false;
    const content=[song.title,song.artist,...(song.seq||[]),song.sheet||'',state.sheets[song.id]||''].join(' ').toLowerCase();
    return content.includes(query);
  });
}
function renderSongs(){
  const visible=filteredSongs();
  if(visible.length && !visible.some(s=>s.id===selectedSong))selectedSong=visible[0].id;
  $('#songList').innerHTML=visible.length ? visible.map(s=>`<button class="song-card ${s.id===selectedSong?'active':''}" data-song="${escapeHTML(s.id)}"><div class="song-meta"><span class="eyebrow song-eyebrow">${hasCustom(s)?'MY SONG · ':''}${languageCode[s.region]||'OT'} · ${escapeHTML(s.region.toUpperCase())}</span><span class="level ${s.level}">${s.level}</span></div><h3>${escapeHTML(s.title)} ${state.songs.includes(s.id)?'<span class="song-learned">✓</span>':''}</h3><small>${escapeHTML(s.artist||'Your song')}</small><div class="mini-chords">${s.seq?.length?s.seq.slice(0,6).map(chord=>`<span>${escapeHTML(chord)}</span>`).join(''):'<span>No chords tagged</span>'}${s.seq?.length>6?'<span>+more</span>':''}</div></button>`).join('') : '<div class="empty">No matching songs. Adjust the filters or add a new song.</div>';
  if(!visible.length){$('#songDetail').innerHTML='<div class="empty">Select a song to see its chord sheet.</div>';return;}
  const s=findSong(selectedSong);
  const sheet=hasCustom(s) ? s.sheet : (typeof state.sheets[s.id]==='string'?state.sheets[s.id]:(s.sheet||''));
  const hasSheet=!!sheet.trim();
  const external=safeURL(s.url) || `https://www.google.com/search?q=${encodeURIComponent(`${s.title} ${s.artist} guitar chords`)}`;
  const canLoop=(s.seq||[]).some(chord=>chordById(chord));
  $('#songDetail').innerHTML=`<div class="eyebrow">${hasCustom(s)?'SAVED IN MY LIBRARY':'STARTER SONG'} · ${escapeHTML(s.region.toUpperCase())}</div><h3>${escapeHTML(s.title)}</h3><div class="by">${escapeHTML(s.artist||'Your collection')} · ${escapeHTML(s.level)} difficulty</div><div class="chord-strip">${s.seq?.length?s.seq.map(c=>`<button data-hear="${escapeHTML(c)}" ${chordById(c)?'':'disabled title="Chord sound unavailable"'} aria-label="Hear chord ${escapeHTML(c)}">${escapeHTML(c)} ♫</button>`).join(''):'<span class="tiny muted">No chords detected. Edit your song to add them.</span>'}</div><p class="tiny muted"><b>Rhythm:</b> ${escapeHTML(s.strum||'Practise at your own tempo')}<br><b>Aeman’s note:</b> ${escapeHTML(s.tip||'Start slowly and check every chord change.')}</p><div class="detail-actions"><button class="btn small" data-play-loop="${escapeHTML(s.id)}" ${canLoop?'':'disabled'}>♫ Hear chord loop</button><button class="btn small ${state.songs.includes(s.id)?'secondary':''}" data-song-master="${escapeHTML(s.id)}">${state.songs.includes(s.id)?'✓ Learned · Undo':'Mark learned · +25 pts'}</button></div><div class="song-sheet-area"><div class="eyebrow">LYRICS + CHORDS</div><div class="sheet">${hasSheet?`<div class="sheet-lines">${renderSheet(sheet)}</div>`:'<p class="hint">No lyrics saved yet. You can paste an authorized practice sheet and write chord tags such as <b>[G]</b>, <b>[D]</b> and <b>[Em]</b> before lyric phrases.</p>'}</div>${hasCustom(s)?`<div class="editor-actions"><button class="btn ghost small" data-edit-song="${escapeHTML(s.id)}">✎ Edit this song</button><button class="btn secondary small delete-song" data-delete-song="${escapeHTML(s.id)}">Delete song</button></div>`:`<button class="btn ghost small" id="editSheet">✎ ${hasSheet?'Edit my practice sheet':'Add my lyrics + chords'}</button><div id="sheetEditor" class="sheet-editor" hidden><label for="sheetInput" class="tiny muted">Your private chord sheet</label><textarea id="sheetInput" rows="10" maxlength="40000" placeholder="[G]Your lyrics [D]here..."></textarea><div class="editor-actions"><button class="btn small" id="saveSheet">Save practice sheet</button><button class="btn secondary small" id="cancelSheet">Cancel</button></div></div>`}</div><a class="linkish" href="${escapeHTML(external)}" target="_blank" rel="noopener noreferrer">${s.url?'Open source chord chart ↗':'Search for a chord chart ↗'}</a><p class="tiny muted sheet-footer">Built-in progressions are simplified examples. The full song may use a different key, capo or chord pattern. Only paste lyrics you are allowed to use.</p>`;
}
function renderPlan(){
  $('#startDate').value=state.start;
  $('#weekReadout').textContent=`Week ${weekNumber()}`;
  const current=currentPhase();
  $('#roadmap').innerHTML=phases.map((phase,index)=>`<article class="roadmap-card ${index===current?'current':''}"><div class="roadmap-number"><small>WEEK</small><strong>${phase.span}</strong></div><div class="roadmap-main">${index===current?'<span class="level">CURRENT LEVEL</span>':''}<h3>${escapeHTML(phase.name)}</h3><p class="tiny muted">${escapeHTML(phase.desc)}</p><div class="week-tip"><strong>AEMAN'S TIP</strong><p>${escapeHTML(phase.tip)}</p></div><div class="goals">${phase.goals.map(([id,title])=>`<label class="goal ${state.goals.includes(id)?'done':''}"><input type="checkbox" data-goal="${id}" ${state.goals.includes(id)?'checked':''}><span>${escapeHTML(title)}</span></label>`).join('')}</div></div></article>`).join('');
}
function renderJournal(){
  updateStats();
  $('#entries').innerHTML=state.entries.length ? state.entries.slice().reverse().map(e=>`<article class="entry"><div class="meta"><span>${escapeHTML(shownDate(e.date))} · ${escapeHTML(e.mood)}</span><button class="delete" data-delete-entry="${escapeHTML(e.id)}" aria-label="Delete journal entry">Delete</button></div><p>${escapeHTML(e.text)}</p></article>`).join('') : '<div class="empty">No entries yet. Log your next practice session to build a record of your progress.</div>';
}
function toggleWithMessage(list,id,award){
  const wasDone=state[list].includes(id);
  if(!toggle(list,id)){toast('Could not save. Export a backup and check browser storage.');return;}
  updateStats();
  if(!wasDone){toast(`Marked complete · +${award} points`);celebrate();}
  else toast('Completion removed · Points updated');
}

// SONG EDITOR — built-in tracks can have a personal sheet; new tracks can have full metadata.
function openSongModal(id=''){
  const form=$('#songForm');form.reset();
  $('#songEditId').value='';
  $('#songModalTitle').textContent=id?'Edit my song':'Add your song';
  $('#saveCustomSong').textContent=id?'Save changes':'Save song to my library';
  if(id){
    const song=state.customSongs.find(item=>item.id===id);
    if(!song)return;
    $('#songEditId').value=id;
    $('#customTitle').value=song.title;
    $('#customArtist').value=song.artist;
    $('#customRegion').value=song.region;
    $('#customLevel').value=song.level;
    $('#customChords').value=song.seq.join(' ');
    $('#customSheet').value=song.sheet;
    $('#customURL').value=song.url;
    $('#customTip').value=song.tip;
  }
  $('#songModal').showModal();
  $('#customTitle').focus();
}
function closeSongModal(){ $('#songModal').close(); }
$('#songForm').addEventListener('submit',event=>{
  event.preventDefault();
  const title=$('#customTitle').value.trim();
  const sheet=$('#customSheet').value.trim();
  if(!title || !sheet){toast('A song title and chord sheet are required.');return;}
  const source=$('#customURL').value.trim();
  if(source && !safeURL(source)){toast('Please use an http:// or https:// source link.');return;}
  const edited=$('#songEditId').value;
  const old=state.customSongs.find(song=>song.id===edited);
  const id=edited || `custom-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.floor(Math.random()*100000)}`}`;
  const manuallyEntered=$('#customChords').value.trim().replace(/[,;]+/g,' ');
  const seq=parseChords(manuallyEntered || sheet);
  const song={
    id, title, artist:$('#customArtist').value.trim()||'Unknown artist',
    region:$('#customRegion').value, level:$('#customLevel').value,
    seq, sheet, url:source, tip:$('#customTip').value.trim()||'Practise at a comfortable tempo.',
    strum:'Use your preferred strumming pattern', mine:true,
    created:old?.created||new Date().toISOString()
  };
  try{
    if(!putSong(song)){toast('Browser storage is full. Export a backup first.');return;}
  }catch(err){toast(err.message);return;}
  selectedSong=id;
  $('#songSource').value='mine';
  $('#songSearch').value='';
  $('#songRegion').value='all';
  $('#songLevel').value='all';
  closeSongModal();renderSongs();updateStats();
  toast(edited?'Song updated in your library':'Song saved to your library');
});
$('#addSongBtn').addEventListener('click',()=>openSongModal());
$('#closeSongModal').addEventListener('click',closeSongModal);
$('#cancelSongModal').addEventListener('click',closeSongModal);
$('#songModal').addEventListener('click',event=>{
  if(event.target===$('#songModal'))closeSongModal();
});

// METRONOME — accurate scheduled audio, live controls, optional tap tempo.
const metronome=new Metronome((beat,beats)=>renderMetroBeats(beat,beats));
const taps=[];
try{
  const prefs=JSON.parse(localStorage.getItem('strum-metronome-v2')||'{}');
  if(Number.isFinite(prefs.bpm))metronome.bpm=Math.min(220,Math.max(40,prefs.bpm));
  if([3,4,6].includes(prefs.beats))metronome.beats=prefs.beats;
  if(Number.isFinite(prefs.volume))metronome.volume=Math.min(1,Math.max(0,prefs.volume));
}catch{}
function storeMetronome(){
  try{localStorage.setItem('strum-metronome-v2',JSON.stringify({bpm:metronome.bpm,beats:metronome.beats,volume:metronome.volume}));}catch{}
}
function renderMetroBeats(active=-1, count=metronome.beats){
  $('#metroBeats').innerHTML=Array.from({length:count},(_,index)=>`<div class="metro-beat ${index===0?'first':''} ${active===index?'on':''}" aria-label="Beat ${index+1}${index===active?', active':''}"><span>${index+1}</span></div>`).join('');
}
function setTempo(value){
  metronome.bpm=Math.max(40,Math.min(220,Math.round(Number(value)||80)));
  $('#tempoRange').value=metronome.bpm;
  $('#tempoNumber').textContent=metronome.bpm;
  storeMetronome();
}
function updateMetroButton(){
  const active=metronome.running;
  $('#metroToggle').textContent=active?'■ Stop metronome':'▶ Start metronome';
  $('#metroToggle').setAttribute('aria-pressed',String(active));
  $('#metroStatus').textContent=active?`Playing · ${metronome.bpm} BPM · ${metronome.beats} beats per bar`:'Stopped · Ready to practise';
}
$('#tempoRange').addEventListener('input',event=>{setTempo(event.target.value);updateMetroButton();});
$('#tempoMinus').addEventListener('click',()=>{setTempo(metronome.bpm-1);updateMetroButton();});
$('#tempoPlus').addEventListener('click',()=>{setTempo(metronome.bpm+1);updateMetroButton();});
$('#beatCount').addEventListener('change',async event=>{
  await metronome.reconfigure({beats:Number(event.target.value)});
  storeMetronome();renderMetroBeats(-1);updateMetroButton();
});
$('#metroVolume').addEventListener('input',event=>{
  metronome.volume=Number(event.target.value)/100;
  $('#volumeReadout').textContent=`${Math.round(metronome.volume*100)}%`;
  storeMetronome();
});
$('#metroToggle').addEventListener('click',async()=>{
  if(metronome.running)metronome.stop();
  else {
    try{await metronome.start();}
    catch(e){toast('Audio cannot start in this browser. Check audio permissions.');}
  }
  updateMetroButton();
});
$('#tapTempo').addEventListener('click',()=>{
  const now=performance.now();
  if(taps.length && now-taps.at(-1)>2500)taps.length=0;
  taps.push(now);if(taps.length>6)taps.shift();
  if(taps.length>=2){
    const diffs=taps.slice(1).map((time,index)=>time-taps[index]);
    const average=diffs.reduce((sum,x)=>sum+x,0)/diffs.length;
    setTempo(60000/average);updateMetroButton();
    $('#metroStatus').textContent=`Tap tempo measured: ${metronome.bpm} BPM`;
  }else $('#metroStatus').textContent='Tap again to set the tempo';
});
$$('[data-tempo]').forEach(button=>button.addEventListener('click',()=>{setTempo(button.dataset.tempo);updateMetroButton();}));
setTempo(metronome.bpm);
$('#beatCount').value=String(metronome.beats);
$('#metroVolume').value=Math.round(metronome.volume*100);
$('#volumeReadout').textContent=`${Math.round(metronome.volume*100)}%`;
renderMetroBeats();

// Shared controls, including those generated dynamically by render functions.
document.addEventListener('click',async event=>{
  const nav=event.target.closest('[data-go]');
  if(nav){event.preventDefault();go(nav.dataset.go);return;}
  const open=event.target.closest('[data-open]');
  if(open){await playNote(frequencies[Number(open.dataset.open)]);return;}
  const fret=event.target.closest('[data-string][data-fret]');
  if(fret){
    const stringIndex=Number(fret.dataset.string),n=Number(fret.dataset.fret);
    $$('.fret-cell.selected').forEach(el=>el.classList.remove('selected'));
    fret.classList.add('selected');
    $('#fretStatus').textContent=`String ${6-stringIndex}, fret ${n} → ${noteFor(stringIndex,n)}${n===12?' · one octave above the open string':''}`;
    await playNote(frequencies[stringIndex]*2**(n/12));return;
  }
  const filter=event.target.closest('[data-chord-filter]');
  if(filter){chordFilter=filter.dataset.chordFilter;renderChords();return;}
  const chord=event.target.closest('[data-chord]');
  if(chord){selectedChord=chord.dataset.chord;renderChords();return;}
  const hear=event.target.closest('[data-hear]');
  if(hear){if(!await playChord(hear.dataset.hear))toast('A sound sample is not available for this chord.');return;}
  const mastered=event.target.closest('[data-master]');
  if(mastered){toggleWithMessage('chords',mastered.dataset.master,10);renderChords();return;}
  const chooseSong=event.target.closest('[data-song]');
  if(chooseSong){selectedSong=chooseSong.dataset.song;renderSongs();return;}
  const songMaster=event.target.closest('[data-song-master]');
  if(songMaster){toggleWithMessage('songs',songMaster.dataset.songMaster,25);renderSongs();return;}
  const playLoop=event.target.closest('[data-play-loop]');
  if(playLoop){
    const song=findSong(playLoop.dataset.playLoop);
    if(song){try{await playChordLoop(song.seq);toast('Playing the simplified chord loop');}catch{toast('Audio playback is not supported in this browser.');}}
    return;
  }
  const edit=event.target.closest('[data-edit-song]');
  if(edit){openSongModal(edit.dataset.editSong);return;}
  const remove=event.target.closest('[data-delete-song]');
  if(remove){
    const song=state.customSongs.find(s=>s.id===remove.dataset.deleteSong);
    if(song && confirm(`Delete "${song.title}" from your saved songs?`)){
      if(selectedSong===song.id)selectedSong='morning';
      if(!removeSong(song.id)){toast('Could not save changes in browser storage.');return;}
      renderSongs();updateStats();toast('Song deleted from your library');
    }
    return;
  }
  if(event.target.closest('#editSheet')){
    $('#sheetEditor').hidden=false;
    const song=findSong(selectedSong);
    $('#sheetInput').value=state.sheets[song.id]??song.sheet??'';
    $('#sheetInput').focus();return;
  }
  if(event.target.closest('#cancelSheet')){$('#sheetEditor').hidden=true;return;}
  if(event.target.closest('#saveSheet')){
    const old=state.sheets[selectedSong];
    state.sheets[selectedSong]=$('#sheetInput').value;
    if(!saveProgress()){
      if(old===undefined)delete state.sheets[selectedSong];else state.sheets[selectedSong]=old;
      toast('Storage unavailable. Could not save this practice sheet.');return;
    }
    renderSongs();toast('Chord + lyric sheet saved locally');return;
  }
  const delEntry=event.target.closest('[data-delete-entry]');
  if(delEntry && confirm('Delete this journal entry?')){
    state.entries=state.entries.filter(entry=>entry.id!==delEntry.dataset.deleteEntry);
    if(!saveProgress()){toast('Could not save this change.');return;}
    renderJournal();toast('Journal entry deleted');
  }
});

$('#songSearch').addEventListener('input',renderSongs);
for(const id of ['songRegion','songLevel','songSource']) $(`#${id}`).addEventListener('change',renderSongs);
document.addEventListener('change',event=>{
  if(event.target.matches('[data-goal]')){
    toggleWithMessage('goals',event.target.dataset.goal,15);renderPlan();
  }
  if(event.target.id==='startDate'){
    const date=event.target.value;
    if(date && /^\d{4}-\d{2}-\d{2}$/.test(date)){
      state.start=date;saveProgress();renderPlan();updateStats();toast('Start date updated');
    }
  }
});
$('#storyToggle').addEventListener('click',()=>{
  const expanded=$('.story').classList.toggle('expanded');
  $('#storyToggle').setAttribute('aria-expanded',String(expanded));
  $('#storyToggle').textContent=expanded?'Hide my story ↑':'Read my story ↓';
});
$('#practiceBtn').addEventListener('click',()=>{
  if(state.practices.includes(today()))return;
  state.practices.push(today());
  if(!saveProgress()){toast('Unable to save today’s session.');return;}
  updateStats();toast('Practice logged · +8 points');celebrate();
});
$('#journalForm').addEventListener('submit',event=>{
  event.preventDefault();
  const text=$('#entryText').value.trim();if(!text)return;
  state.entries.push({id:`note-${Date.now()}-${Math.floor(Math.random()*100000)}`,date:today(),mood:$('#entryMood').value,text});
  if(!saveProgress()){toast('Could not save your note. Check browser storage.');return;}
  $('#entryText').value='';renderJournal();toast('Practice journal saved · +5 points');celebrate();
});
$('#exportBackup').addEventListener('click',()=>{
  const blob=new Blob([exportBackup()],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`strum-backup-${today()}.json`;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Backup downloaded');
});
$('#importBackupBtn').addEventListener('click',()=>$('#importBackupFile').click());
$('#importBackupFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file)return;
  if(file.size>12*1024*1024){toast('Backup is too large to import (maximum 12 MB).');return;}
  try{
    const contents=await file.text();
    if(!confirm('Restoring this backup replaces your current saved songs, notes and progress. Continue?'))return;
    restoreBackup(contents);
    selectedSong='morning';
    $('#songSource').value='all';
    $('#songSearch').value='';
    $('#songRegion').value='all';
    $('#songLevel').value='all';
    updateStats();renderChords();renderSongs();renderPlan();renderJournal();
    toast('Backup restored successfully');
  }catch(error){toast(`Could not restore: ${error.message}`);}
});

renderStrings();renderFrets();renderChords();renderSongs();renderPlan();renderJournal();updateStats();
const initial=window.location.hash.slice(1);
if(availableViews.includes(initial))go(initial);
