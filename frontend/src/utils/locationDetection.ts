// Location detection utility for USTP CDO Campus
// Defines precise building boundaries and detection logic

import { USTP_CAMPUS_LOCATIONS, CAMPUS_BOUNDARY } from './campusCoordinates';

export interface BuildingPolygon {
    name: string;
    coordinates: [number, number][]; // [lng, lat] pairs forming a polygon
    center?: [number, number]; // [lng, lat] center point (optional)
    buffer?: number; // Buffer zone in meters (optional)
}

export interface LocationDetectionResult {
    location: string | null;
    confidence: number;
    alternatives: Array<{ location: string; confidence: number }>;
}

// Use building polygons from campusCoordinates.ts
export const USTP_BUILDING_POLYGONS: BuildingPolygon[] = USTP_CAMPUS_LOCATIONS;

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

/**
 * Calculate distance between two points in meters
 */
function calculateDistance(point1: [number, number], point2: [number, number]): number {
    const R = 6371000; // Earth's radius in meters
    const [lng1, lat1] = point1;
    const [lng2, lat2] = point2;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Check if a point is within campus boundaries
 */
export function isWithinCampus(point: [number, number]): boolean {
    return isPointInPolygon(point, CAMPUS_BOUNDARY);
}

/**
 * Detect location from coordinates with confidence scoring
 */
export function detectLocationFromCoordinates(
    coordinates: { lat: number; lng: number }
): LocationDetectionResult {
    const point: [number, number] = [coordinates.lng, coordinates.lat];

    // Check if point is within campus
    if (!isWithinCampus(point)) {
        return {
            location: null,
            confidence: 0,
            alternatives: []
        };
    }

    const results: Array<{ location: string; confidence: number }> = [];

    // Check each building polygon
    for (const building of USTP_BUILDING_POLYGONS) {
        let confidence = 0;

        // Check if point is inside building polygon
        if (isPointInPolygon(point, building.coordinates)) {
            confidence = 95; // High confidence for points inside building
        } else if (building.center && building.buffer) {
            // Only use center/buffer if they exist
            const distance = calculateDistance(point, building.center);
            const maxDistance = building.buffer;

            if (distance <= maxDistance) {
                // Confidence decreases with distance
                confidence = Math.max(10, 90 - (distance / maxDistance) * 80);
            }
        }
        // If no center/buffer, only polygon detection is used

        if (confidence > 0) {
            results.push({
                location: building.name,
                confidence: Math.round(confidence)
            });
        }
    }

    // Sort by confidence (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    // Return result with high confidence threshold
    const primaryResult = results[0];
    const alternatives = results.slice(1, 4); // Top 3 alternatives

    return {
        location: primaryResult && primaryResult.confidence >= 80 ? primaryResult.location : null,
        confidence: primaryResult ? primaryResult.confidence : 0,
        alternatives
    };
}

/**
 * Get building polygon by name
 */
export function getBuildingPolygon(locationName: string): BuildingPolygon | null {
    return USTP_BUILDING_POLYGONS.find(building => building.name === locationName) || null;
}

/**
 * Get all building polygons for map visualization
 */
export function getAllBuildingPolygons(): BuildingPolygon[] {
    return USTP_BUILDING_POLYGONS;
}
