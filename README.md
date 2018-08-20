# sharawadji

A library for playing spatialised audio localised in embedded Google Street View.

Heavily based on the [Sounds of Street View Framework](https://github.com/Amplifon/Sounds-of-Street-View-Framework) by Amplifon.

## Usage

First, you need to create a JSON/JavaScript array containing the soundwalk data.
Here's an example of a soundwalk with 2 sounds:

```json
[
  {
    "name": "ac35fb0f-d22e-44c7-a468-c42650604ea6",
    "lat": "51.534913693030184",
    "lng": "-0.05588034302932166",
    "timestamp": 551459942721,
    "src": "https://s3-eu-west-1.amazonaws.com/ebre/ac35fb0f-d22e-44c7-a468-c42650604ea6.mp3",
    "db": 80,
    "loop": true
  },
  {
    "name": "fac7b958-0f9b-455b-af2f-d45c469a4e4b",
    "lat": "51.53486440977307",
    "lng": "-0.05593648268821039",
    "timestamp": 1529766751245,
    "src": "https://s3-eu-west-1.amazonaws.com/ebre/fac7b958-0f9b-455b-af2f-d45c469a4e4b.mp3",
    "db": 80,
    "loop": false
  }
]
```

Then you can instantiate `Sharawadji` over a Street View instance with the given sounds.

```js
const container = document.getElementById('myStreetView');

// make sure you start the StreetView near the sounds
const mapOptions = {
  position: new google.maps.LatLng(lat, lng),
  pov: { heading: heading, pitch: pitch }
};

const map = new google.maps.StreetViewPanorama(container, mapOptions);

// you can toggle debug mode and the optional Web Audio compressor
const options = { debug: false, compressor: true };
// `sounds` is the soundwalk data object
const sharawadji = new Sharawadji(sounds, map, options);
```
