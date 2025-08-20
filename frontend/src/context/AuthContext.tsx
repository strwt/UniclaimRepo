import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, authService, type UserData, getFirebaseErrorMessage } from "../utils/firebase";
import { listenerManager } from "../utils/ListenerManager";

interface AuthContextType {
  isAuthenticated: boolean;
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, contactNum: string, studentId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
        
        try {
          // Fetch user data from Firestore
          const fetchedUserData = await authService.getUserData(firebaseUser.uid);
          setUserData(fetchedUserData);
        } catch (error: any) {
          console.error('AuthContext: Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        // User logged out - clean up all listeners first
        try {
          listenerManager.removeAllListeners();
        } catch (error) {
          console.error('AuthContext: Error during listener cleanup:', error);
          // Force cleanup if normal cleanup fails
          listenerManager.forceCleanup();
        }
        
        setUser(null);
        setUserData(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await authService.login(email, password);
      // onAuthStateChanged will handle updating the state
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
      setLoading(false);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    contactNum: string,
    studentId: string
  ): Promise<void> => {
    try {
      setLoading(true);
      await authService.register(email, password, firstName, lastName, contactNum, studentId);
      // onAuthStateChanged will handle updating the state
    } catch (error: any) {
      console.error('AuthContext: Registration failed:', error);
      setLoading(false);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clean up listeners before logout
      try {
        listenerManager.removeAllListeners();
      } catch (error) {
        console.error('AuthContext: Error during pre-logout cleanup:', error);
        listenerManager.forceCleanup();
      }
      
      await authService.logout();
      // onAuthStateChanged will handle updating the state
    } catch (error: any) {
      console.error('AuthContext: Logout failed:', error);
      setLoading(false);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      userData,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
