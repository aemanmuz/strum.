// AUDIO: Web Audio API generated guitar-like tones and metronome clicks.
import { chordById, frequencies } from './chords.js';
let context;
export async function getAudio() {
  if (!context) {
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) throw new Error('This browser does not support Web Audio.');
    context = new Constructor();
  }
  if (context.state === 'suspended') await context.resume();
  return context;
}
function tone(ctx, frequency, at, length=.85, volume=.15) {
  const oscillator=ctx.createOscillator();
  const gain=ctx.createGain();
  oscillator.type='triangle';
  oscillator.frequency.setValueAtTime(frequency,at);
  gain.gain.setValueAtTime(.0001,at);
  gain.gain.exponentialRampToValueAtTime(volume,at+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,at+length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(at); oscillator.stop(at+length+.01);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
}
export async function playNote(frequency,delay=0) {
  try { const ctx=await getAudio(); tone(ctx,frequency,ctx.currentTime+delay); return true; }
  catch (e) { console.warn(e); return false; }
}
export async function playChord(id, offset=0) {
  const shape=chordById(id); if (!shape) return false;
  try {
    const ctx=await getAudio(); let played=0;
    shape.frets.forEach((fret,index)=>{
      if(fret>=0){tone(ctx,frequencies[index]*2**(fret/12),ctx.currentTime+offset+played*.058,.93,.105);played++;}
    });
    return true;
  } catch(error){console.warn(error);return false;}
}
export async function playChordLoop(sequence) {
  const ctx=await getAudio(); let offset=0;
  sequence.filter(id=>chordById(id)).slice(0,6).forEach(id=>{
    const shape=chordById(id); let played=0;
    shape.frets.forEach((fret,index)=>{
      if(fret>=0){tone(ctx,frequencies[index]*2**(fret/12),ctx.currentTime+offset+played*.045,.62,.1);played++;}
    });
    offset+=.8;
  });
}

export class Metronome {
  constructor(onBeat) {
    this.onBeat=onBeat;
    this.bpm=80;
    this.beats=4;
    this.volume=.55;
    this.running=false;
    this.currentBeat=0;
    this.nextTime=0;
    this.timer=null;
    this.visualTimers=new Set();
    this.generation=0;
  }
  async start() {
    if(this.running)return;
    const ctx=await getAudio();
    this.running=true;
    this.generation++;
    this.currentBeat=0;
    this.nextTime=ctx.currentTime+.045;
    this.tick(ctx);
    this.timer=setInterval(()=>this.tick(ctx),25);
  }
  stop(){
    this.running=false;
    this.generation++;
    if(this.timer!==null)clearInterval(this.timer);
    this.timer=null;
    for(const t of this.visualTimers)clearTimeout(t);
    this.visualTimers.clear();
    this.onBeat(-1,this.beats);
  }
  // A clock look-ahead schedules each sound on the audio timeline. Audio timing
  // stays steady even if the page takes a moment to render.
  tick(ctx){
    if(!this.running)return;
    while(this.nextTime < ctx.currentTime+.12){
      const beat=this.currentBeat;
      this.click(ctx,this.nextTime,beat===0);
      const delay=Math.max(0,(this.nextTime-ctx.currentTime)*1000);
      const generation=this.generation;
      const t=setTimeout(()=>{
        this.visualTimers.delete(t);
        if(this.running && this.generation===generation)this.onBeat(beat,this.beats);
      },delay);
      this.visualTimers.add(t);
      this.nextTime+=60/this.bpm;
      this.currentBeat=(this.currentBeat+1)%this.beats;
    }
  }
  click(ctx,time,strong){
    const oscillator=ctx.createOscillator();
    const gain=ctx.createGain();
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(strong?1400:950,time);
    oscillator.frequency.exponentialRampToValueAtTime(strong?690:450,time+.045);
    gain.gain.setValueAtTime(Math.max(.0001,this.volume*(strong?.30:.18)),time);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.055);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(time); oscillator.stop(time+.058);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  // Changes to tempo / meter stop future scheduling and restart in sync.
  async reconfigure(settings) {
    const wasRunning=this.running;
    this.stop();
    Object.assign(this,settings);
    if(wasRunning)await this.start();
    else this.onBeat(-1,this.beats);
  }
}
