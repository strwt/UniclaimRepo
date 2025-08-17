import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationMapViewProps {
  coordinates: { lat: number; lng: number };
  location: string;
}

export default function LocationMapView({ coordinates, location }: LocationMapViewProps) {
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Location Map</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        html, body, #map { 
          margin: 0; 
          padding: 0; 
          height: 100%; 
          font-family: 'Manrope', sans-serif; 
        }
        .location-info {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .coordinates-info {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          background: rgba(255,255,255,0.95);
          padding: 8px;
          border-radius: 6px;
          z-index: 1000;
          font-size: 12px;
          text-align: center;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="location-info">📍 ${location}</div>
      <div class="coordinates-info">
        Lat: ${coordinates.lat.toFixed(6)} | Lng: ${coordinates.lng.toFixed(6)}
      </div>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <script>
        const map = L.map('map', {
          center: [${coordinates.lat}, ${coordinates.lng}],
          zoom: 18,
          zoomControl: true,
          scrollWheelZoom: false,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Add marker for the location
        const marker = L.marker([${coordinates.lat}, ${coordinates.lng}])
          .addTo(map)
          .bindPopup('<b>${location}</b><br>Coordinates: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}')
          .openPopup();

        // Fit map to show the marker with some padding
        const bounds = L.latLngBounds([
          [${coordinates.lat - 0.001}, ${coordinates.lng - 0.001}], 
          [${coordinates.lat + 0.001}, ${coordinates.lng + 0.001}]
        ]);
        map.fitBounds(bounds, { padding: [20, 20] });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ height: 300, borderRadius: 8, overflow: 'hidden' }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: mapHTML }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
}
