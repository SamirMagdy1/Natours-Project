/* eslint-disable */

export const displayMap = (locations) => {
  maptilersdk.config.apiKey = 'I1BxspJQ5fWGWEJPsF4u';
  const map = new maptilersdk.Map({
    container: 'map',
    style:
      'https://api.maptiler.com/maps/5d25271f-cd33-4fed-93b2-90cb4be2c612/style.json?key=jEi4fWOUWwzmQW1WOJlh',
    scrollZoom: false,
    zoom: 4,
  });

  const bounds = new maptilersdk.LngLatBounds();

  locations.forEach((loc) => {
    // creat marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    new maptilersdk.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // add popup
    new maptilersdk.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description} </p>`)
      .addTo(map);

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
