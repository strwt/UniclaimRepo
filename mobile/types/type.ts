export type RootStackParamList = {
  Index: undefined;
  OnBoarding: undefined;
  App: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Report: undefined;
  Profile: undefined;
  MyTicket: undefined;
  Message: undefined;
  RootBottomTabs: undefined;
  InitialRouter: undefined;
  ItemDetails: undefined;
  PostDetails: { post: Post }; // ✅ FIXED: added param to the screen
  USTPMapScreen: {
    setCoordinatesFromMap: (coords: { lat: number; lng: number }) => void;
  };
};
export type Post = {
  id: string;
  type: "lost" | "found";
  category: string;
  status?: "keep" | "turnover";
  images: (string | number)[]; // ✅ Must be a URI string, not an imported image or number
  title: string;
  location: string;
  datetime: string;
  description: string;
  postedBy: string;
};
