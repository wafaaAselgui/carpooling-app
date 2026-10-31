import L from "leaflet";

// Sleek vector teardrop pin with white inner core and elevation shadow
export const departureIcon = L.divIcon({
  className: "custom-pin-departure",
  html: `
    <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61 26.39 0 17 0Z" fill="#f29e00"/>
        <circle cx="17" cy="16" r="6" fill="#ffffff"/>
      </svg>
      <span style="position: absolute; top: 11px; width: 6px; height: 6px; border-radius: 50%; background-color: #f29e00;"></span>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -42],
});

export const destinationIcon = L.divIcon({
  className: "custom-pin-destination",
  html: `
    <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(227, 27, 109, 0.35));">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61 26.39 0 17 0Z" fill="#0b7f70"/>
        <circle cx="17" cy="16" r="6" fill="#ffffff"/>
      </svg>
      <span style="position: absolute; top: 11px; width: 6px; height: 6px; border-radius: 50%; background-color: #0b7f70;"></span>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -42],
});