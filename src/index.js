import { Sound } from './sound.js';
import { throttle } from './utils.js';

class Sharawadji {
	constructor(sounds, map) {
		if (!('AudioContext' in window) && !('webkitAudioContext' in window)) {
			throw new Error('Your browser does not support the Web Audio API');
		} else {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
		}

		if (!('google' in window)) {
			throw new Error(
				'Cannot find the Google Maps API. Make sure you\'ve included it in your HTML.');
		}

		this.audioContext = new AudioContext();
		this.sounds = sounds.map(s => new Sound(this.audioContext, s, map));

		this.updateMix = this.updateMix.bind(this);

		google.maps.event.addListener(map, 'pano_changed', throttle(this.updateMix, 500));
    google.maps.event.addListener(map, 'position_changed', throttle(this.updateMix, 500));
    google.maps.event.addListener(map, 'pov_changed', throttle(this.updateMix, 500));
	}

	updateMix() {
		this.sounds.forEach(s => s.updateMix());
	}
};

export { Sharawadji };
