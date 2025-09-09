// Coordinate Editor Tool for USTP Campus Buildings
// This tool helps you easily update building coordinates

export interface BuildingEditor {
    name: string;
    currentCoordinates: [number, number][];
    currentCenter: [number, number];
    currentBuffer: number;
}

// Current building data for editing
export const BUILDING_EDITOR_DATA: BuildingEditor[] = [
    {
        name: "Library",
        currentCoordinates: [
            [124.6565, 8.4855], [124.6570, 8.4855],
            [124.6570, 8.4860], [124.6565, 8.4860]
        ],
        currentCenter: [124.65675, 8.48575],
        currentBuffer: 100
    },
    {
        name: "Canteen",
        currentCoordinates: [
            [124.6560, 8.4850], [124.6565, 8.4850],
            [124.6565, 8.4855], [124.6560, 8.4855]
        ],
        currentCenter: [124.65625, 8.48525],
        currentBuffer: 80
    },
    {
        name: "Gymnasium",
        currentCoordinates: [
            [124.6570, 8.4850], [124.6575, 8.4850],
            [124.6575, 8.4855], [124.6570, 8.4855]
        ],
        currentCenter: [124.65725, 8.48525],
        currentBuffer: 90
    },
    {
        name: "Main Entrance",
        currentCoordinates: [
            [124.6560, 8.4855], [124.6565, 8.4855],
            [124.6565, 8.4860], [124.6560, 8.4860]
        ],
        currentCenter: [124.65625, 8.48575],
        currentBuffer: 70
    },
    {
        name: "Computer Laboratory",
        currentCoordinates: [
            [124.6575, 8.4855], [124.6580, 8.4855],
            [124.6580, 8.4860], [124.6575, 8.4860]
        ],
        currentCenter: [124.65775, 8.48575],
        currentBuffer: 80
    },
    {
        name: "Science Building",
        currentCoordinates: [
            [124.6580, 8.4850], [124.6585, 8.4850],
            [124.6585, 8.4855], [124.6580, 8.4855]
        ],
        currentCenter: [124.65825, 8.48525],
        currentBuffer: 90
    },
    {
        name: "Engineering Hall",
        currentCoordinates: [
            [124.6585, 8.4855], [124.6590, 8.4855],
            [124.6590, 8.4860], [124.6585, 8.4860]
        ],
        currentCenter: [124.65875, 8.48575],
        currentBuffer: 100
    },
    {
        name: "Student Lounge",
        currentCoordinates: [
            [124.6565, 8.4860], [124.6570, 8.4860],
            [124.6570, 8.4865], [124.6565, 8.4865]
        ],
        currentCenter: [124.65675, 8.48625],
        currentBuffer: 70
    },
    {
        name: "Registrar Office",
        currentCoordinates: [
            [124.6560, 8.4860], [124.6565, 8.4860],
            [124.6565, 8.4865], [124.6560, 8.4865]
        ],
        currentCenter: [124.65625, 8.48625],
        currentBuffer: 60
    },
    {
        name: "Clinic",
        currentCoordinates: [
            [124.6570, 8.4860], [124.6575, 8.4860],
            [124.6575, 8.4865], [124.6570, 8.4865]
        ],
        currentCenter: [124.65725, 8.48625],
        currentBuffer: 70
    },
    {
        name: "Parking Lot A",
        currentCoordinates: [
            [124.6555, 8.4850], [124.6560, 8.4850],
            [124.6560, 8.4855], [124.6555, 8.4855]
        ],
        currentCenter: [124.65575, 8.48525],
        currentBuffer: 80
    },
    {
        name: "Parking Lot B",
        currentCoordinates: [
            [124.6590, 8.4850], [124.6595, 8.4850],
            [124.6595, 8.4855], [124.6590, 8.4855]
        ],
        currentCenter: [124.65925, 8.48525],
        currentBuffer: 80
    },
    {
        name: "Auditorium",
        currentCoordinates: [
            [124.6575, 8.4860], [124.6580, 8.4860],
            [124.6580, 8.4865], [124.6575, 8.4865]
        ],
        currentCenter: [124.65775, 8.48625],
        currentBuffer: 90
    },
    {
        name: "Basketball Court",
        currentCoordinates: [
            [124.6580, 8.4860], [124.6585, 8.4860],
            [124.6585, 8.4865], [124.6580, 8.4865]
        ],
        currentCenter: [124.65825, 8.48625],
        currentBuffer: 80
    },
    {
        name: "Swimming Pool Area",
        currentCoordinates: [
            [124.6585, 8.4860], [124.6590, 8.4860],
            [124.6590, 8.4865], [124.6585, 8.4865]
        ],
        currentCenter: [124.65875, 8.48625],
        currentBuffer: 80
    },
    {
        name: "Admin Office",
        currentCoordinates: [
            [124.6560, 8.4865], [124.6565, 8.4865],
            [124.6565, 8.4870], [124.6560, 8.4870]
        ],
        currentCenter: [124.65625, 8.48675],
        currentBuffer: 70
    },
    {
        name: "Dormitory",
        currentCoordinates: [
            [124.6555, 8.4855], [124.6560, 8.4855],
            [124.6560, 8.4860], [124.6555, 8.4860]
        ],
        currentCenter: [124.65575, 8.48575],
        currentBuffer: 100
    },
    {
        name: "Innovation Hub",
        currentCoordinates: [
            [124.6570, 8.4865], [124.6575, 8.4865],
            [124.6575, 8.4870], [124.6570, 8.4870]
        ],
        currentCenter: [124.65725, 8.48675],
        currentBuffer: 80
    },
    {
        name: "Covered Court",
        currentCoordinates: [
            [124.6575, 8.4865], [124.6580, 8.4865],
            [124.6580, 8.4870], [124.6575, 8.4870]
        ],
        currentCenter: [124.65775, 8.48675],
        currentBuffer: 80
    },
    {
        name: "Security Office",
        currentCoordinates: [
            [124.6565, 8.4865], [124.6570, 8.4865],
            [124.6570, 8.4870], [124.6565, 8.4870]
        ],
        currentCenter: [124.65675, 8.48675],
        currentBuffer: 60
    }
];

// Helper functions for coordinate editing

/**
 * Calculate center point from coordinates
 */
export function calculateCenter(coordinates: [number, number][]): [number, number] {
    const lngSum = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const latSum = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    return [lngSum / coordinates.length, latSum / coordinates.length];
}

/**
 * Generate code for updating a building
 */
export function generateBuildingCode(building: BuildingEditor): string {
    return `
{
  name: "${building.name}",
  coordinates: [
    [${building.currentCoordinates[0][0]}, ${building.currentCoordinates[0][1]}], // Top-left
    [${building.currentCoordinates[1][0]}, ${building.currentCoordinates[1][1]}], // Top-right
    [${building.currentCoordinates[2][0]}, ${building.currentCoordinates[2][1]}], // Bottom-right
    [${building.currentCoordinates[3][0]}, ${building.currentCoordinates[3][1]}]  // Bottom-left
  ],
  center: [${building.currentCenter[0]}, ${building.currentCenter[1]}],
  buffer: ${building.currentBuffer}
}`;
}

/**
 * Generate complete code for all buildings
 */
export function generateAllBuildingsCode(): string {
    return BUILDING_EDITOR_DATA.map(building => generateBuildingCode(building)).join(',\n');
}

// Instructions for using this tool:
/*
1. Open Google Maps and find USTP CDO campus
2. For each building, get the real coordinates:
   - Right-click on building corners
   - Copy the coordinates [longitude, latitude]
3. Update the currentCoordinates array with real building corners
   - Can be any shape: rectangle, L-shape, complex polygon
   - Add as many points as needed
   - Always close the polygon (end where you started)
4. The center will be calculated automatically
5. Adjust buffer if needed (higher = more forgiving detection)
6. Copy the generated code and paste it into campusCoordinates.ts

EXAMPLES:

Simple Rectangle (4 points):
coordinates: [
  [124.6572, 8.4858], [124.6578, 8.4858], 
  [124.6578, 8.4863], [124.6572, 8.4863]
]

L-Shaped Building (6 points):
coordinates: [
  [124.6585, 8.4855], [124.6590, 8.4855], 
  [124.6590, 8.4858], [124.6588, 8.4858], 
  [124.6588, 8.4860], [124.6585, 8.4860]
]

Complex Building (8+ points):
coordinates: [
  [124.6560, 8.4855], [124.6565, 8.4855], 
  [124.6565, 8.4858], [124.6568, 8.4858], 
  [124.6568, 8.4860], [124.6565, 8.4860], 
  [124.6565, 8.4863], [124.6560, 8.4863]
]
*/
