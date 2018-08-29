import { latLngDist } from './utils.js';

const MIX_TRANS_TIME = 2;
const PLAY_DISTANCE_THRESHOLD = 70;
const LOAD_DISTANCE_THRESHOLD = 100;

class Sound {
  constructor(context, data, map, destination, options) {
    const { debug } = options;

    this.debug = debug;
    this.data = data;
    this.map = map;
    this.state = Sound.state.IDLE;

    const { src, lat, lng, loop } = data;
    this.position = new google.maps.LatLng(lat, lng);
    this.src = src;
    this.loop = loop;

    if (debug) {
      this.marker = new google.maps.Marker({
        title: `${this.data.name} – ${(new Date(data.timestamp)).toLocaleString()}`,
        position: this.position,
        map
      });
    }

    this.context = context;
    this.destination = destination;

    this.updateMix();
  }

  static get state() {
    return {
      IDLE: 0,
      LOADING: 1,
      PLAYING: 2,
      SUSPENDED: 3
    };
  }

  createFXGraph() {
    this.panner = this.context.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'exponential';
    this.panner.setPosition(this.position.lat(), this.position.lng(), 0);

    this.filter = this.context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 22000;

    this.gain = this.context.createGain();
    this.gain.gain.setValueAtTime(0, this.context.currentTime);

    this.panner.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.destination);

    this.processingChainStart = this.panner;
  }

  start() {
    this.source = this.context.createBufferSource();
    this.source.loop = this.loop;
    this.source.buffer = this.buffer;
    this.source.connect(this.processingChainStart);
    this.source.start(this.context.currentTime);
    this.state = Sound.state.PLAYING;
  }

  stop() {
    this.source.disconnect();
    this.state = Sound.state.SUSPENDED;
  }

  async load(src) {
    const response = await fetch(src);
    const soundData = await response.arrayBuffer();
    this.state = Sound.state.LOADING;
    if (this.debug) console.info(`loading ${src}`);

    try {
      // iOS Safari still doesn't support dAD with promises ¯\_(ツ)_/¯
      this.context.decodeAudioData(
        soundData,
        buffer => {
          if (this.debug) console.info(`loaded`, src, buffer, this.loaded);
          this.buffer = buffer;
          this.createFXGraph();
          this.state = Sound.state.SUSPENDED;
          this.playIfNear();
        },
        err => {
          throw new Error(err);
        }
      );
    } catch(e) {
      console.warn(`Couldn't decode ${src}`);
    }
  }

  playIfNear() {
    const userPosition = this.map.getPosition();
    // Calculate distance between user and sound
    const distance = latLngDist(this.position, userPosition);

    switch(this.state) {
      case Sound.state.LOADING:
        return false;
      case Sound.state.PLAYING:
        if (distance >= PLAY_DISTANCE_THRESHOLD) {
          this.stop();
          return false;
        }
        break;
      case Sound.state.SUSPENDED:
        if (distance < PLAY_DISTANCE_THRESHOLD) {
          this.start();
        } else {
          return false;
        }
        break;
      case Sound.state.IDLE:
      default:
        if (distance < LOAD_DISTANCE_THRESHOLD) {
          try {
            this.load(this.src);
          } catch(e) {
            console.warn(`Couldn't load ${src}`);
          }
          return false;
        } else {
          return false;
        }
        break;
    }

    return distance;
  }

  updateMix(gain) {
    const distance = this.playIfNear();
    if (distance === false) return;

    // Calculate new volume based on distance
    const targetVolume = Sound.volumeForDistance(distance, this.data.db) * gain;
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
