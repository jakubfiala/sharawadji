const EARTH_RADIUS = 6378137;
const KM_TO_MILES = 0.000621371192;

const rad = x => x * Math.PI / 180;

const latLngDist = function(p1, p2, metric) {
  const dLat = rad(p2.lat() - p1.lat());
  const dLong = rad(p2.lng() - p1.lng());

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat()))
    * Math.sin(dLong / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS * c;

  if (metric == latLngDist.metrics.MILES) {
    return distanceKm * KM_TO_MILES;
  }

  return distanceKm;
};

latLngDist.metrics = {
  MILES: 0,
  KILOMETERS: 1
};

/**
 * throttle wrapper which we need for scrolling listeners: http://www.ianlopshire.com/javascript-scroll-events-doing-it-right/
 *
 * @param      {Function}  callback  The function to throttle
 * @param      {Number}    wait      The minimum time that needs to pass between successive function calls
 * @return     {Function}    { the throttled function }
 */
const throttle = (callback, wait) => {
  let go = true;
  return () => {
    if (go) {
      go = false;
      setTimeout(() => {
        go = true;
        callback.call();
      }, wait);
    }
  };
};

export { latLngDist, throttle };
