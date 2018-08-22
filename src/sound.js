import { latLngDist } from './utils.js';

const MIX_TRANS_TIME = 0.7;
const DISTANCE_THRESHOLD = 70;

class Sound {
  constructor(context, data, map, destination, options) {
    const { debug } = options;

    this.data = data;
    this.map = map;
    this.loaded = false;

    const { src, lat, lng, loop } = data;
    this.position = new google.maps.LatLng(lat, lng);
    this.src = src;

    if (debug) {
      this.marker = new google.maps.Marker({
        title: `${this.data.name} – ${(new Date(data.timestamp)).toLocaleString()}`,
        position: this.position,
        map
      });
    }

    this.context = context;
    this.destination = destination;

    this.source = context.createBufferSource();
    this.source.loop = loop;

    this.panner = context.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'exponential';

    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';

    this.gain = context.createGain();
    this.gain.gain.value = 0;

    this.panner.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.destination);

    this.processingChainStart = this.panner;
    this.updateMix();
  }

  async load(src) {
    const response = await fetch(src);
    const soundData = await response.arrayBuffer();
    this.loaded = true;

    try {
      this.source.buffer = await this.context.decodeAudioData(soundData);
      this.source.connect(this.processingChainStart);

      this.source.start(this.context.currentTime);
    } catch(e) {
      console.warn(`Couldn't decode ${src}`);
    }
  }

  updateMix() {
    const userPosition = this.map.getPosition();

    // Calculate distance between user and sound
    const distance = latLngDist(this.position, userPosition);
    console.log(this.data.name, distance);

    if (!this.loaded && distance < DISTANCE_THRESHOLD) {
      try {
        this.load(this.src);
      } catch(e) {
        console.warn(`Couldn't load ${src}`);
      }
    }

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
        .linearRampToValueAtTime(11000 - (Math.abs(angle) - 90) * 55, this.context.currentTime + MIX_TRANS_TIME);
    } else {
      this.filter.frequency
        .linearRampToValueAtTime(11000, this.context.currentTime + MIX_TRANS_TIME);
    }

    // Calculate new volume based on distance
    const targetVolume = Sound.volumeForDistance(distance, this.data.db);
    // Set new volume
    this.gain.gain
      .linearRampToValueAtTime(targetVolume, this.context.currentTime + MIX_TRANS_TIME);
  }

  static volumeForDistance(distance, amplitude) {
    // Calculate volume by using Inverse Square Law
    const volume = 1 / distance ** 2;
    // Multiply distance volume by amplitude of sound (apply ceiling max of 1)
    return Math.min(volume * amplitude, 1);
  };
}

export { Sound };
