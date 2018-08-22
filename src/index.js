import { Sound } from './sound.js';
import { throttle } from './utils.js';

class Sharawadji {
	constructor(sounds, map, options) {
		if (!('AudioContext' in window) && !('webkitAudioContext' in window)) {
			throw new Error('Your browser does not support the Web Audio API');
		} else {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
		}

		if (!('google' in window)) {
			throw new Error(
				'Cannot find the Google Maps API. Make sure you\'ve included it in your HTML.');
		}

		const { debug, compressor } = options;

		this.audioContext = new AudioContext();
		this.masterGain = this.audioContext.createGain();

		this.sounds = sounds.map(s => new Sound(this.audioContext, s, map, this.masterGain, { debug }));

		if (compressor) {
			this.compressor = this.audioContext.createDynamicsCompressor();
			this.compressor.threshold.setValueAtTime(-50, this.audioContext.currentTime);
			this.compressor.knee.setValueAtTime(40, this.audioContext.currentTime);
			this.compressor.ratio.setValueAtTime(25, this.audioContext.currentTime);
			this.compressor.attack.setValueAtTime(0, this.audioContext.currentTime);
			this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

			this.masterGain.connect(this.compressor);
			this.compressor.connect(this.audioContext.destination);
		} else {
			this.masterGain.connect(this.audioContext.destination);
		}

		this.updateMix = this.updateMix.bind(this);

		google.maps.event.addListener(map, 'pano_changed', throttle(this.updateMix, 500));
    google.maps.event.addListener(map, 'position_changed', throttle(this.updateMix, 500));
    google.maps.event.addListener(map, 'pov_changed', throttle(this.updateMix, 500));
	}

	updateMix() {
		this.sounds.forEach(s => s.updateMix());
	}
};

window.Sharawadji = Sharawadji;

export { Sharawadji };
