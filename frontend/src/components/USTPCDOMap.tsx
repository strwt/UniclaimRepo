import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat, toLonLat, transformExtent } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { Icon, Style, Fill, Stroke, Text } from "ol/style";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Modify } from "ol/interaction";
import { defaults as defaultControls } from "ol/control";
import { detectLocationFromCoordinates } from "@/utils/locationDetection";
import { USTP_CAMPUS_LOCATIONS } from "@/utils/campusCoordinates";

interface Props {
  locationError?: boolean;
  coordinates?: { lat: number; lng: number } | null;
  setCoordinatesExternal?: (
    coords: { lat: number; lng: number } | null
  ) => void;
}

const USTPLocationPicker: React.FC<Props> = ({
  locationError = false,
  coordinates,
  setCoordinatesExternal,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [localError, setLocalError] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  const { showToast } = useToast();

  const [confirmedCoordinates, setConfirmedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(coordinates ?? null);

  const markerSourceRef = useRef<VectorSource>(new VectorSource());
  const markerFeatureRef = useRef<Feature<Point> | null>(null);
  const buildingSourceRef = useRef<VectorSource>(new VectorSource());

  const fromLonLatExtent = (extent: [number, number, number, number]) =>
    transformExtent(extent, "EPSG:4326", "EPSG:3857");

  const initializeMap = () => {
    if (!mapRef.current) return;

    const initialCenter = confirmedCoordinates
      ? fromLonLat([confirmedCoordinates.lng, confirmedCoordinates.lat])
      : fromLonLat([124.6570494294046, 8.485713351944865]);

    const markerSource = markerSourceRef.current;
    const buildingSource = buildingSourceRef.current;

    // Create building boundary layer (hidden)
    const buildingLayer = new VectorLayer({
      source: buildingSource,
      style: () => {
        // No visual styling - buildings are invisible
        return new Style({
          fill: new Fill({
            color: 'transparent' // Invisible fill
          }),
          stroke: new Stroke({
            color: 'transparent', // Invisible border
            width: 0
          })
        });
      }
    });

    // Create corner indicator layer (hidden)
    const cornerSource = new VectorSource();
    const cornerLayer = new VectorLayer({
      source: cornerSource,
      style: () => {
        // No visual styling - corners are invisible
        return new Style({
          image: new Icon({
            src: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="1" height="1" xmlns="http://www.w3.org/2000/svg">
                <circle cx="0.5" cy="0.5" r="0.5" fill="transparent"/>
              </svg>
            `),
            scale: 0.1,
            anchor: [0.5, 0.5]
          })
        });
      }
    });

    // Create marker layer
    const markerLayer = new VectorLayer({ source: markerSource });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }), 
        buildingLayer, 
        cornerLayer,
        markerLayer
      ],
      view: new View({
        center: initialCenter,
        zoom: 19,
        extent: fromLonLatExtent([124.6545, 8.484, 124.659, 8.488]), // ✅ Right edge adjusted
      }),

      controls: defaultControls({ attribution: false }),
    });

    // Add building polygons to the map using coordinates from campusCoordinates.ts
    USTP_CAMPUS_LOCATIONS.forEach(building => {
      const coordinates = building.coordinates.map(coord => fromLonLat(coord));
      const polygon = new Polygon([coordinates]);
      const feature = new Feature({
        geometry: polygon,
        name: building.name
      });
      buildingSource.addFeature(feature);

      // Add corner indicators
      const cornerLabels = ['1', '2', '3', '4']; // TOP-LEFT, TOP-RIGHT, BOTTOM-RIGHT, BOTTOM-LEFT
      building.coordinates.forEach((coord, index) => {
        const point = new Point(fromLonLat(coord));
        const cornerFeature = new Feature({
          geometry: point,
          cornerLabel: cornerLabels[index]
        });
        cornerSource.addFeature(cornerFeature);
      });
    });

    if (coordinates && !markerFeatureRef.current) {
      const { lat, lng } = coordinates;
      const point = new Point(fromLonLat([lng, lat]));
      const feature = new Feature({ geometry: point });
      feature.setStyle(
        new Style({
          image: new Icon({
            src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            scale: 0.05,
            anchor: [0.5, 1],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
            crossOrigin: "anonymous",
          }),
        })
      );
      markerSource.addFeature(feature);
      markerFeatureRef.current = feature;
    }

    // Click to place/update marker
    map.on("click", (e) => {
      const [lng, lat] = toLonLat(e.coordinate);
      const point = new Point(fromLonLat([lng, lat]));

      // Detect location from coordinates
      const detectionResult = detectLocationFromCoordinates({ lat, lng });
      setDetectedLocation(detectionResult.location);

      let feature = markerFeatureRef.current;
      if (!feature) {
        feature = new Feature({ geometry: point });
        feature.setStyle(
          new Style({
            image: new Icon({
              src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
              scale: 0.05,
              anchor: [0.5, 1],
              anchorXUnits: "fraction",
              anchorYUnits: "fraction",
              crossOrigin: "anonymous",
            }),
          })
        );
        markerSource.addFeature(feature);
        markerFeatureRef.current = feature;
      } else {
        feature.setGeometry(point);
      }

      const updated = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
      setCoordinatesExternal?.(updated);
      setLocalError(false);

      // Show feedback based on detection result
      if (detectionResult.location && detectionResult.confidence >= 80) {
        showToast(
          "success",
          "Location Detected",
          `${detectionResult.location} detected`,
          3000
        );
      } else {
        showToast(
          "error",
          "No Location Detected",
          "Please pin within a campus building or area. Make sure you're within the campus boundaries.",
          4000
        );
      }
    });

    const modify = new Modify({ source: markerSource });
    map.addInteraction(modify);

    modify.on("modifyend", (e) => {
      const geom = (e.features.item(0).getGeometry() as Point).getCoordinates();
      const [lng, lat] = toLonLat(geom);
      
      // Detect location from new coordinates
      const detectionResult = detectLocationFromCoordinates({ lat, lng });
      setDetectedLocation(detectionResult.location);
      
      const updated = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
      setCoordinatesExternal?.(updated);
      setLocalError(false);
    });

    setMapInstance(map);
    setTimeout(() => map.updateSize(), 200);
  };

  useEffect(() => {
    if (!mapInstance && showMap) {
      initializeMap();
    }

    if (!showMap && mapInstance) {
      mapInstance.setTarget(undefined);
      setMapInstance(null);
    }
  }, [showMap]);

  const handleLocationSubmit = () => {
    if (!coordinates) {
      setLocalError(true);
      showToast(
        "error",
        "Missing Location",
        "Please pin a location on the map.",
        5000
      );
      return;
    }

    setConfirmedCoordinates(coordinates); // ✅ Save submitted location

    showToast(
      "success",
      "Location Saved",
      "The pinned location has been saved successfully.",
      5000
    );

    setShowMap(false);
  };

  return (
    <div className="mt-4 rounded space-y-3">
      <label className="block text-black">Map of USTP-CDO Campus</label>

      <div className="flex gap-3 w-full">
        <input
          type="text"
          readOnly
          value={
            detectedLocation 
              ? `${detectedLocation} (${coordinates?.lat.toFixed(5)}, ${coordinates?.lng.toFixed(5)})`
              : coordinates 
                ? `Coordinates: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`
                : ""
          }
          className={`w-full p-3 rounded focus:outline-none text-sm font-medium ${
            locationError || localError
              ? "border-2 border-red-500"
              : detectedLocation
                ? "border-2 border-green-500 bg-green-50"
                : "border border-gray-500"
          }`}
          placeholder="Pin a location on the map to detect building/area"
        />
        {!showMap && (
          <button
            onClick={() => setShowMap(true)}
            className="bg-navyblue text-white px-4 py-2 rounded hover:bg-blue-900 transition text-sm whitespace-nowrap"
          >
            Show Map
          </button>
        )}
      </div>

      {showMap && (
        <>

          <div
            ref={mapRef}
            className="w-full h-96 rounded shadow-amber-200 mt-4"
          />

          <div className="flex flex-row gap-3">
            <button
              type="button"
              onClick={handleLocationSubmit}
              className="w-full bg-green-600 text-sm text-white p-2 rounded hover:bg-green-700 transition"
            >
              Submit Location
            </button>

            <button
              onClick={() => setShowMap(false)}
              className="w-full bg-red-600 text-sm text-white p-2 rounded hover:bg-red-700 transition"
            >
              Close Map
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default USTPLocationPicker;
