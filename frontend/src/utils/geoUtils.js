// frontend/src/utils/geoUtils.js

/**
 * Great-circle distance between two [lat, lng] coordinates in kilometers
 */
export function getDistanceKm([lat1, lon1], [lat2, lon2]) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Calculates perpendicular distance from a point P to a line segment AB (in km)
 */
function distanceToSegment([pLat, pLon], [aLat, aLon], [bLat, bLon]) {
    const l2 = Math.pow(bLat - aLat, 2) + Math.pow(bLon - aLon, 2);
    if (l2 === 0) return getDistanceKm([pLat, pLon], [aLat, aLon]);

    // Projection fraction t of point P onto line AB
    let t = ((pLat - aLat) * (bLat - aLat) + (pLon - aLon) * (bLon - aLon)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projLat = aLat + t * (bLat - aLat);
    const projLon = aLon + t * (bLon - aLon);
    return {
        distanceKm: getDistanceKm([pLat, pLon], [projLat, projLon]),
        tRatio: t, // Progress along segment
    };
}

/**
 * Finds the minimum distance from point P to an entire polyline (route geometry)
 * and returns how far along the total route (progress fraction 0.0 to 1.0) it lies.
 */
export function projectPointOntoRoute(point, polylineCoords) {
    if (!polylineCoords || polylineCoords.length < 2) return null;

    let minDistance = Infinity;
    let bestSegmentIndex = 0;
    let bestT = 0;

    for (let i = 0; i < polylineCoords.length - 1; i++) {
        const segA = polylineCoords[i];
        const segB = polylineCoords[i + 1];
        const { distanceKm, tRatio } = distanceToSegment(point, segA, segB);

        if (distanceKm < minDistance) {
            minDistance = distanceKm;
            bestSegmentIndex = i;
            bestT = tRatio;
        }
    }

    // Normalized progress along the entire polyline
    const routeProgress = (bestSegmentIndex + bestT) / (polylineCoords.length - 1);

    return {
        distanceKm: minDistance,
        progress: routeProgress,
    };
}

/**
 * Accurate Road-Corridor Check:
 * Returns true if:
 * 1. User's departure is close to the driver's route (within toleranceKm)
 * 2. User's destination is close to the driver's route (within toleranceKm)
 * 3. Driver is moving forward (user destination progress > user departure progress)
 */
export function isRouteCompatible(userDep, userDest, routeGeometry, toleranceKm = 35) {
    if (!routeGeometry || routeGeometry.length < 2) return false;

    // If both points provided
    if (userDep && userDest) {
        const depProj = projectPointOntoRoute(userDep, routeGeometry);
        const destProj = projectPointOntoRoute(userDest, routeGeometry);

        if (!depProj || !destProj) return false;

        const isDepNearRoute = depProj.distanceKm <= toleranceKm;
        const isDestNearRoute = destProj.distanceKm <= toleranceKm;
        const isCorrectDirection = destProj.progress > depProj.progress;

        return isDepNearRoute && isDestNearRoute && isCorrectDirection;
    }

    // If only departure was clicked
    if (userDep) {
        const depProj = projectPointOntoRoute(userDep, routeGeometry);
        return depProj ? depProj.distanceKm <= toleranceKm : false;
    }

    // If only destination was clicked
    if (userDest) {
        const destProj = projectPointOntoRoute(userDest, routeGeometry);
        return destProj ? destProj.distanceKm <= toleranceKm : false;
    }

    return true;
}

/**
 * Fetches real driving road polyline from free OSRM service
 */
const routeCache = new Map();

export async function fetchDrivingRoute(startCoords, endCoords) {
    const key = `${startCoords.join(",")}_${endCoords.join(",")}`;
    if (routeCache.has(key)) return routeCache.get(key);

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes[0]) {
            // GeoJSON coordinates are [lon, lat], Leaflet expects [lat, lon]
            const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
            routeCache.set(key, coords);
            return coords;
        }
    } catch (e) {
        console.warn("OSRM routing unavailable, using straight fallback:", e);
    }

    // Fallback: simple interpolated line
    const fallback = [startCoords, endCoords];
    routeCache.set(key, fallback);
    return fallback;
}

/**
 * Reverse Geocoding with OpenStreetMap Nominatim for exact locality names
 */
export async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`
        );
        const data = await res.json();
        if (data && data.address) {
            const addr = data.address;
            return (
                addr.city ||
                addr.town ||
                addr.village ||
                addr.suburb ||
                addr.county ||
                addr.state ||
                `${lat.toFixed(2)}, ${lng.toFixed(2)}`
            );
        }
    } catch {
        // quiet fallback
    }
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}