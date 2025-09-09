import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
  detectedLocation?: string | null;
}

interface CoordinatesContextType {
  coordinates: Coordinates | null;
  setCoordinates: (coords: Coordinates) => void;
  setCoordinatesFromMap: (coords: Coordinates) => void;
}

const CoordinatesContext = createContext<CoordinatesContextType | undefined>(undefined);

export const useCoordinates = () => {
  const context = useContext(CoordinatesContext);
  if (context === undefined) {
    throw new Error('useCoordinates must be used within a CoordinatesProvider');
  }
  return context;
};

interface CoordinatesProviderProps {
  children: ReactNode;
}

export const CoordinatesProvider: React.FC<CoordinatesProviderProps> = ({ children }) => {
  const [coordinates, setCoordinatesState] = useState<Coordinates | null>(null);

  const setCoordinates = (coords: Coordinates) => {
    setCoordinatesState(coords);
  };

  const setCoordinatesFromMap = (coords: Coordinates) => {
    setCoordinatesState(coords);
  };

  const value = {
    coordinates,
    setCoordinates,
    setCoordinatesFromMap,
  };

  return (
    <CoordinatesContext.Provider value={value}>
      {children}
    </CoordinatesContext.Provider>
  );
};
