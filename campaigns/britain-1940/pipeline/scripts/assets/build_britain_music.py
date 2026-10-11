"""Original quiet instrumental score. Circular envelopes/periodic oscillators give a gapless PCM loop."""
from pathlib import Path
import wave, json
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
RATE=24000
DURATION=64
N=RATE*DURATION
T=np.arange(N,dtype=np.float64)/RATE
MIX=np.zeros((N,2),dtype=np.float64)
CHORDS=[(50,57,65,69),(43,55,62,70),(46,53,62,65),(48,55,64,67),
        (50,57,65,69),(41,53,60,69),(43,55,62,70),(45,57,61,64)]

def hz(note):
    # Whole cycles over the score duration, so phases agree at the loop boundary.
    return round((440*2**((note-69)/12))*DURATION)/DURATION

def pan(sig,p):
    MIX[:,0]+=sig*np.cos(p*np.pi/2)
    MIX[:,1]+=sig*np.sin(p*np.pi/2)

for bar,notes in enumerate(CHORDS):
    a=(T-bar*8+2)%DURATION
    env=np.zeros(N)
    env[a<2]=.5-.5*np.cos(np.pi*a[a<2]/2)
    env[(a>=2)&(a<8)]=1
    fade=(a>=8)&(a<10)
    env[fade]=.5+.5*np.cos(np.pi*(a[fade]-8)/2)
    for i,note in enumerate(notes):
        phase=i*.53
        w=2*np.pi*hz(note)*T
        tone=np.sin(w+phase)+.16*np.sin(2*w+phase*.7)+.055*np.sin(3*w)
        pan(tone*env*.034,[.22,.68,.38,.78][i])
    # Soft piano notes; circular tails continue through the first sample instead of being cut.
    for beat in range(4):
        onset=bar*8+beat*2
        age=(T-onset)%DURATION
        envelope=(1-np.exp(-age/.018))*np.exp(-age/1.25)
        w=2*np.pi*hz(notes[2+beat%2])*T
        tone=np.sin(w)+.25*np.sin(2*w)+.09*np.sin(3*w)+.035*np.sin(4*w)
        pan(tone*envelope*.06,.4 if beat%2 else .6)

MIX-=MIX.mean(axis=0)
MIX*=.44/np.max(np.abs(MIX))
PCM=np.rint(MIX*32767).astype('<i2')
OUT=ROOT/'public/audio/music/operations-room.wav'
OUT.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(OUT),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(PCM.tobytes())
report={'durationSec':DURATION,'sampleRate':RATE,'peak':float(np.max(np.abs(MIX))),
        'loopStep':float(np.max(np.abs(MIX[0]-MIX[-1]))),
        'minHalfSecondRms':float(min(np.sqrt(np.mean(MIX[i:i+RATE//2]**2)) for i in range(0,N,RATE//2)))}
print(json.dumps(report))
