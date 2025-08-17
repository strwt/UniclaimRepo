import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Style, Icon } from "ol/style";

export default function ClickToPinMap(): React.ReactElement {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ustpCoords = fromLonLat([124.65668599249877, 8.485334447871173]); // USTP-CDO Center

    // Create vector source and layer for pins
    const pinSource = new VectorSource();
    const pinLayer = new VectorLayer({
      source: pinSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: "https://openlayers.org/en/latest/examples/data/icon.png",
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current!,
      layers: [new TileLayer({ source: new OSM() }), pinLayer],
      view: new View({
        center: ustpCoords,
        zoom: 18.5,
        minZoom: 17,
        maxZoom: 50,
      }),
    });

    // 🖱️ Add click event to place a pin
    map.on("click", (event) => {
      const clickedCoord = event.coordinate;
      const pin = new Feature({
        geometry: new Point(clickedCoord),
      });
      pinSource.clear(); // Optional: remove previous pin
      pinSource.addFeature(pin);

      const [lon, lat] = toLonLat(clickedCoord);
      console.log("Pinned location:", lat, lon);
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow-lg rounded-2xl">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Click Anywhere on USTP-CDO Map to Drop a Pin
      </h2>
      <div
        ref={mapRef}
        className="w-full h-[500px] rounded-xl border border-gray-300"
      />
    </div>
  );
}
