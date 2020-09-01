import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { connect, Room, RemoteParticipant, RemoteTrack } from 'twilio-video';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  form: FormGroup;
  room!: Room;
  remoteParticipants: RemoteParticipant[] = [];

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      accessToken: [localStorage.getItem('accessToken'), [Validators.required]]
    });
  }

  async connect() {
    if (this.form.invalid) { return; }

    localStorage.setItem('accessToken', this.form.value.accessToken);

    this.room = await connect(this.form.value.accessToken,
      {
        name: 'twilio-basic',
        audio: false,
        video: true,
        logLevel: 'debug'
      });

    this.room.localParticipant.videoTracks.forEach(publication => {
      if (publication.track.kind === 'video') {
        document.getElementById('local-media-div')?.appendChild(publication.track.attach());
      }
    });

    this.room.participants.forEach(participant => {
      this.addRemoteParticipant(participant);
    });

    this.room.on('participantConnected', (participant: RemoteParticipant) => {
      this.addRemoteParticipant(participant);
    });

    this.room.on('participantDisconnected', (participant: RemoteParticipant) => {
      this.removeRemoteParticipant(participant);
    });
  }

  disconnect() {
    this.room.disconnect();
    this.remoteParticipants.length = 0;
  }

  private addRemoteParticipant(participant: RemoteParticipant) {
    this.remoteParticipants.push(participant);

    participant.tracks.forEach(publication => {
      if (publication.isSubscribed && publication.track?.kind === 'video') {
        document.querySelector(`[data-remote-media-div="${participant.sid}"]`)?.appendChild(publication.track.attach());
      }
    });

    participant.on('trackSubscribed', (track: RemoteTrack) => {
      if (track.kind === 'video') {
        document.querySelector(`[data-remote-media-div="${participant.sid}"]`)?.appendChild(track.attach());
      }
    });
  }

  private removeRemoteParticipant(participant: RemoteParticipant) {
    const idx = this.remoteParticipants.findIndex(x => x.sid === participant.sid);
    this.remoteParticipants.splice(idx, 1);
  }
}
