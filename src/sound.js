// import { Howler, Howl } from './lib/howler.custom.js';
import { latLngDist } from './utils.js';

class Sound {
  constructor(context, data, map) {
    this.data = data;
    this.map = map;

    const { src, lat, lng } = data;
    this.position = new google.maps.LatLng(lat, lng);

    this.context = context;
    this.source = context.createBufferSource();
    this.source.loop = true;

    this.panner = context.createPanner();
    this.panner.panningModel = 'equalpower';

    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';

    this.gain = context.createGain();
    this.gain.gain.value = 0;

    this.panner
      .connect(this.filter)
      .connect(this.gain)
      .connect(this.context.destination);

    this.load(src[0]);
  }

  async load(src) {
    const response = await fetch(src);
    const soundData = await response.arrayBuffer();

    try {
      var buffer = await this.context.decodeAudioData(soundData);

      this.source.buffer = buffer;
      this.source.connect(this.panner);

      this.source.start(this.context.currentTime);
      this.updateMix();
    } catch(e) {
      console.warn(`Couldn't decode ${src}`);
    }
  }

  updateMix() {
    const userPosition = this.map.getPosition();
    const userLat = userPosition.lat();
    const userLng = userPosition.lng();
    const userHeading = this.map.getPov().heading;

    const xDiff = this.position.lat() - userLat;
    const yDiff = this.position.lng() - userLng;

    const rawAngle = Math.atan2(yDiff, xDiff) * (180 / Math.PI) - userHeading;
    // wrap the angle so it ranges between -180 and 180
    const angle = Math.abs(rawAngle) > 180 ? -1 * rawAngle % 180 : rawAngle;

    // Set the new pan poition
    this.panner.setPosition(angle / 90 % 2, 1, 1);

    // Apply lowpass filter *if* the sound is behind us (11,000hz = filter fully open)
    if (Math.abs(angle) > 90) {
      this.filter.frequency
        .linearRampToValueAtTime(11000 - (Math.abs(angle) - 90) * 55, this.context.currentTime + 1);
    } else {
      this.filter.frequency
        .linearRampToValueAtTime(11000, this.context.currentTime + 1);
    }

    // Calculate distance between user and sound
    const distance = latLngDist(this.position, this.map.getPosition());
    // Calculate new volume based on distance
    const targetVolume = Sound.volumeForDistance(distance, this.data.db);
    // Set new volume
    this.gain.gain
      .linearRampToValueAtTime(targetVolume, this.context.currentTime + 1);
  }

  static volumeForDistance(distance, amplitude) {
    // Calculate volume by using Inverse Square Law
    const volume = 1 / distance ** 2;
    // Multiply distance volume by amplitude of sound (apply ceiling max of 1)
    return Math.min(volume * amplitude, 1);
  };
}

export { Sound };
