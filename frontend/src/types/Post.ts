export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  type: "lost" | "found";
  coordinates?: { lat: number; lng: number };
  // coordinates: {
  //   lat: number;
  //   lng: number;
  // };
  images: (string | File)[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    contactNum: string;
  };
  createdAt?: string | Date;

  // for tickets show
  status?: "pending" | "resolved" | "rejected";
}
