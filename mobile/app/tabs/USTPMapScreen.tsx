// USTPMapScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useCoordinates } from "../../context/CoordinatesContext";
import { detectLocationFromCoordinates } from "../../utils/locationDetection";

export default function USTPMapScreen() {
  const navigation = useNavigation();
  const { setCoordinatesFromMap } = useCoordinates();

  const onMessage = (event: any) => {
    const coords = JSON.parse(event.nativeEvent.data);
    
    // Detect location from coordinates
    const detectionResult = detectLocationFromCoordinates({
      latitude: coords.lat,
      longitude: coords.lng
    });
    
    setCoordinatesFromMap({
      latitude: coords.lat,
      longitude: coords.lng,
      detectedLocation: detectionResult.location
    });
    navigation.goBack();
  };

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>USTP Map</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
      <!-- Manrope font -->
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
      html, body, #map { 
        margin: 0; 
        padding: 0; 
        height: 100%; 
        font-family: 'Manrope', sans-serif; 
      }
      #confirmBtn {
        position: absolute; 
        bottom: 16px; 
        left: 16px; 
        right: 16px;
        padding: 16px; 
        background: #0A193A; 
        color: white;
        border: none; 
        border-radius: 8px; 
        font-weight: 600;
        font-size: 15px; /* Increased text size */
        font-family: 'Manrope', sans-serif; /* Explicit Manrope font */
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        z-index: 999; 
        display: none;
      }
      #confirmBtn svg {
        width: 20px;
        height: 20px;
        fill: white;
      }
    </style>

    </head>
    <body>
      <div id="map"></div>
      <button id="confirmBtn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9 16.17l-3.88-3.88a1 1 0 0 0-1.41 1.41l4.59 4.59a1 1 0 0 0 1.41 0l10-10a1 1 0 0 0-1.41-1.41L9 16.17z"/>
        </svg>
        Confirm Pin Location
      </button>
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
      <script>
        let selectedLatLng = null;
        const map = L.map('map', {
          center: [8.485713351944865, 124.6570494294046],
          zoom: 18,
          minZoom: 16,
          maxZoom: 20,
          maxBounds: [
            [8.483, 124.654],
            [8.488, 124.660]
          ],
          maxBoundsViscosity: 1.0,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © OpenStreetMap contributors',
          maxZoom: 19,
          noWrap: true,
          bounds: [
            [8.483, 124.654],
            [8.488, 124.660]
          ]
        }).addTo(map);

        let marker;
        map.on('click', function (e) {
          if (marker) map.removeLayer(marker);
          marker = L.marker(e.latlng).addTo(map);
          selectedLatLng = e.latlng;
          document.getElementById('confirmBtn').style.display = 'flex';
        });

        document.getElementById('confirmBtn').onclick = function () {
          if (selectedLatLng) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              lat: selectedLatLng.lat,
              lng: selectedLatLng.lng
            }));
          }
        };
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="flex-row gap-4 items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text className="text-lg font-manrope-semibold">Pin a Location</Text>
      </View>

      <WebView
        originWhitelist={["*"]}
        source={{ html: leafletHTML }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        className="flex-1"
      />
    </SafeAreaView>
  );
}
