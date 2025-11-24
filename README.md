# sharawadji

A library for playing spatialised audio localised in embedded Google Street View.

## Usage

To use Sharawadji, you need to embed an instance of Street View on a website.
Refer to the [official documentation](https://developers.google.com/maps/documentation/javascript/streetview) for a quick guide on how to set up embedded Street View.

First, you need to create a JSON/JavaScript array containing the soundwalk data.
Here's an example of a soundwalk with 2 sounds:

```js
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
    "loop": false,
    "rolloffFactor": 2, // the lower this number, the further the sound reaches (it's inversely proportional)
    "loop": true,
    "filterFrequency": 22000, // add a filter to the sound
    "filterType": "lowpass",
    "positionZ": 0, // displace the sound up/down if needed
    "startTime": 0, // select start & end of the loop within the sound file
    "endTime": 1000,
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
// `sounds` is the soundwalk data object
const sharawadji = new Sharawadji(sounds, map);
```
