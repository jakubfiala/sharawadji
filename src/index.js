import { Sound } from './sound.js';
import { throttle } from './utils.js';

const ATTENUATION_TARGET = 60;

class Sharawadji {
	constructor(sounds, panorama, options) {
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

		this.panorama = panorama;

		this.audioContext = new AudioContext();
		this.masterGain = this.audioContext.createGain();

		this.sounds = sounds.map(s => new Sound(this.audioContext, s, panorama, this.masterGain, { debug }));

		if (compressor) {
			this.compressor = this.audioContext.createDynamicsCompressor();
			this.compressor.threshold.setValueAtTime(-50, this.audioContext.currentTime);
			this.compressor.knee.setValueAtTime(40, this.audioContext.currentTime);
			this.compressor.ratio.setValueAtTime(20, this.audioContext.currentTime);
			this.compressor.attack.setValueAtTime(0.3, this.audioContext.currentTime);
			this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

			this.masterGain.connect(this.compressor);
			this.compressor.connect(this.audioContext.destination);
		} else {
			this.masterGain.connect(this.audioContext.destination);
		}

		this.updateMix = this.updateMix.bind(this);

		google.maps.event.addListener(panorama, 'pano_changed', throttle(this.updateMix, 500));
    google.maps.event.addListener(panorama, 'position_changed', throttle(this.updateMix, 500));
    google.maps.event.addListener(panorama, 'pov_changed', throttle(this.updateMix, 500));
	}

	updateMix() {
		const userPosition = this.panorama.getPosition();
		const userPov = this.panorama.getPov();

		this.audioContext.listener.setPosition(userPosition.lat(), userPosition.lng(), 0);

		const headingRad = userPov.heading * (Math.PI / 180);
		const f1 = Math.cos(headingRad);
		const f3 = Math.sin(headingRad);

		const pitchRad = userPov.pitch * (Math.PI / 180);
		const u1 = Math.cos(pitchRad);
		const u3 = Math.sin(pitchRad);

		this.audioContext.listener.setOrientation(f1, 0, f3, u1, 1, u3);

		const activeSoundsCount = this.sounds.filter(s => s.state === Sound.state.PLAYING).length;

		const attenuation = Math.max(Math.min(activeSoundsCount / ATTENUATION_TARGET, 0.7), 0);
		this.sounds.forEach(s => s.updateMix(1 - attenuation));
	}
};

window.Sharawadji = Sharawadji;

export { Sharawadji };
