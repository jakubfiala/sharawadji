import { Sharawadji } from '../src/index.js';

const DATA_URL = 'https://s3-eu-west-1.amazonaws.com/ebre/test/test.json';

const loadData = async url => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch(e) {
    throw new Error(`Could not load sound data: ${e}`);
  }
};

const loadDemo = async container => {
  const { lat, lng, heading, pitch, sounds } = await loadData(DATA_URL);

  console.log(sounds);

  const mapOptions = {
    position: new google.maps.LatLng(lat, lng),
    pov: { heading: parseFloat(heading), pitch: parseFloat(pitch) }
  };

  const map = new google.maps.StreetViewPanorama(container, mapOptions);
  const sharawadji = new Sharawadji(sounds, map, { debug: true, compressor: true });
}

loadDemo(document.getElementById('view'));
