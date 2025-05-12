import Sound from "./sound.js";
import { calculateListenerOrientation } from "./panner-utils.js";

const MAX_ATTENUATION = 0.7;
const ATTENUATION_TARGET = 60;
const LISTENER_HEADING_OFFSET_DEG = 90;

export default class Sharawadji {
  constructor(sounds, panorama, audioContext = new AudioContext()) {
    this.panorama = panorama;
    this.audioContext = audioContext;
    this.masterGain = new GainNode(this.audioContext);

    this.sounds = sounds.map((s) => this.createSound(s));
    this.masterGain.connect(this.audioContext.destination);

    panorama.addListener("pano_changed", () => this.updateMix());
    panorama.addListener("position_changed", () => this.updateMix());
    panorama.addListener("pov_changed", () => this.updateMix());
  }

  createSound(s) {
    return new Sound(this.audioContext, s, this.panorama, this.masterGain);
  }

  updateMix() {
    const userPosition = this.panorama.getPosition();
    const userPov = this.panorama.getPov();

    if (this.audioContext.listener.positionX) {
      this.audioContext.listener.positionX.value = userPosition.lat();
      this.audioContext.listener.positionY.value = userPosition.lng();
    } else {
      this.audioContext.listener.setPosition(
        userPosition.lat(),
        userPosition.lng(),
        0,
      );
    }

    const { forward, up } = calculateListenerOrientation(
      userPov.heading + LISTENER_HEADING_OFFSET_DEG,
      userPov.pitch,
      0,
    );

    if (this.audioContext.listener.forwardX) {
      this.audioContext.listener.forwardX.value = forward.x;
      this.audioContext.listener.forwardY.value = forward.y;
      this.audioContext.listener.forwardZ.value = forward.z;
      this.audioContext.listener.upX.value = up.x;
      this.audioContext.listener.upY.value = up.y;
      this.audioContext.listener.upZ.value = up.z;
    } else {
      this.audioContext.listener.setOrientation(
        forward.x,
        forward.y,
        forward.z,
        up.x,
        up.y,
        up.z,
      );
    }

    const activeSoundsCount = this.sounds.filter(
      (s) => s.state === Sound.state.PLAYING,
    ).length;

    const attenuation = Math.max(
      Math.min(activeSoundsCount / ATTENUATION_TARGET, MAX_ATTENUATION),
      0,
    );

    this.sounds.forEach((s) => s.updateMix(1 - attenuation));
  }

  getSoundByName(name) {
    return this.sounds.find((sound) => sound.data.name === name);
  }

  addSound(sound) {
    const index = this.sounds.findIndex((s) => s.data.name === sound.name);
    if (index >= 0) {
      this.sounds[index].remove();
      this.sounds.splice(index, 1);
    }

    this.sounds.push(this.createSound(sound));
  }
}
