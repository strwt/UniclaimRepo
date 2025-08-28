import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, authService, UserData, db } from '../utils/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  banInfo: any;
  showBanNotification: boolean;
  setShowBanNotification: (show: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banInfo, setBanInfo] = useState<any>(null);
  const [showBanNotification, setShowBanNotification] = useState(false);

  // Track ban listener to clean up on logout
  const banListenerRef = useRef<(() => void) | null>(null);

  // Helper function to check if user is admin
  const checkIfAdmin = (email: string | null): boolean => {
    if (!email) return false;
    const adminEmails = ['admin@ustp.edu.ph', 'superadmin@ustp.edu.ph', 'admin@uniclaim.com'];
    return adminEmails.includes(email.toLowerCase());
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);

        // Check if user is admin
        const userIsAdmin = checkIfAdmin(firebaseUser.email);
        setIsAdmin(userIsAdmin);

        // Fetch user data from Firestore
        try {
          const fetchedUserData = await authService.getUserData(firebaseUser.uid);
          setUserData(fetchedUserData);

          // Check ban status efficiently
          if (fetchedUserData && fetchedUserData.status === 'banned') {
            setIsBanned(true);
            setBanInfo(fetchedUserData.banInfo || {});
          } else {
            setIsBanned(false);
            setBanInfo(null);
          }
          
          // Start monitoring this specific user for ban status changes
          // Only set up listener if user is authenticated to prevent permission errors during logout
          if (firebaseUser && firebaseUser.uid) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const banUnsubscribe = onSnapshot(userDocRef,
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  const userData = docSnapshot.data() as UserData;

                  // Check if user just got banned
                  if (userData.status === 'banned') {
                    console.log('User banned detected in real-time (mobile)');

                    // IMMEDIATELY stop listening to prevent permission errors
                    banUnsubscribe();
                    banListenerRef.current = null;

                    // Update state
                    setIsBanned(true);
                    setBanInfo(userData.banInfo || {});

                    // Logout user immediately when banned
                    handleImmediateBanLogout(userData);
                  } else if (userData.status === 'active') {
                    // User was unbanned
                    setIsBanned(false);
                    setBanInfo(null);
                  }
                }
              },
              (error) => {
                // Error handler - if listener fails, clean up gracefully
                const isPermissionError = error?.code === 'permission-denied' ||
                  error?.message?.includes('Missing or insufficient permissions');

                if (isPermissionError) {
                  // This is expected during logout - don't log as error
                  // Only log if we're still authenticated (not during logout)
                  if (isAuthenticated) {
                    console.log('Ban listener permission error (expected during logout):', error.message);
                  }
                } else {
                  console.warn('Ban listener error (mobile):', error);
                }

                // Clean up the listener
                banUnsubscribe();
                banListenerRef.current = null;

                // Only start fallback if still authenticated
                if (isAuthenticated) {
                  startPeriodicBanCheck();
                }
              }
            );

            // Store the unsubscribe function for cleanup on logout
            banListenerRef.current = banUnsubscribe;
          }
          
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setIsBanned(false);
          setBanInfo(null);
        }
      } else {
        // User logged out - clean up all listeners
        console.log('User logged out - cleaning up listeners');

        // Clean up ban listener if it exists
        if (banListenerRef.current) {
          console.log('Cleaning up ban listener');
          banListenerRef.current();
          banListenerRef.current = null;
        }

        setUser(null);
        setUserData(null);
        setIsAuthenticated(false);
        setIsBanned(false);
        setIsAdmin(false);
        setBanInfo(null);
        setShowBanNotification(false);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();

      // Clean up ban listener on component unmount
      if (banListenerRef.current) {
        console.log('Cleaning up ban listener on unmount');
        banListenerRef.current();
        banListenerRef.current = null;
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data to check ban status
      const userData = await authService.getUserData(user.uid);
      
      if (userData && userData.status === 'banned') {
        // User is banned, logout immediately
        await authService.logout();
        setIsBanned(true);
        setBanInfo(userData.banInfo || {});
        setShowBanNotification(false);
        // Don't throw error - let the component handle it
        return;
      }
      
      // User is not banned, proceed with login
      setUser(user);
      setUserData(userData);
      setIsAuthenticated(true);
      setIsBanned(false);
      setIsAdmin(checkIfAdmin(user.email));
      setBanInfo(null);
      setShowBanNotification(false);
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Immediately clean up ban listener to prevent permission errors during logout
      // This prevents the race condition where the listener tries to access user data after logout
      if (banListenerRef.current) {
        console.log('Immediately cleaning up ban listener during logout');
        banListenerRef.current();
        banListenerRef.current = null;
      }
      
      await authService.logout();
      // onAuthStateChanged will handle updating the state
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message);
    }
  };

  const refreshUserData = async (): Promise<void> => {
    if (user) {
      try {
        const fetchedUserData = await authService.getUserData(user.uid);
        setUserData(fetchedUserData);
        
        // Update ban status when refreshing user data
        if (fetchedUserData && fetchedUserData.status === 'banned') {
          setIsBanned(true);
          setBanInfo(fetchedUserData.banInfo || {});
        } else {
          setIsBanned(false);
          setBanInfo(null);
        }
      } catch (error: any) {
        console.error('Error refreshing user data:', error);
        setIsBanned(false);
        setBanInfo(null);
      }
    }
  };

  const handleImmediateBanLogout = async (bannedUserData: UserData) => {
    try {
      console.log('Immediate logout due to ban detected (mobile)');

      // Clean up ban listener before logout to prevent permission errors
      if (banListenerRef.current) {
        console.log('Cleaning up ban listener during ban logout');
        banListenerRef.current();
        banListenerRef.current = null;
      }

      // Logout user immediately
      await authService.logout();

      // Reset all auth state completely
      setUser(null);
      setUserData(null);
      setIsAuthenticated(false);
      setIsBanned(true);
      setIsAdmin(false);
      setBanInfo(bannedUserData.banInfo || {});

      // Don't show ban notification - user will be redirected to login
      setShowBanNotification(false);

      // Force navigation to login by setting user to null
      // This will trigger the navigation logic to redirect to login
      console.log('User logged out due to ban (mobile):', bannedUserData.banInfo);

    } catch (error) {
      console.error('Error during immediate ban logout (mobile):', error);

      // Clean up ban listener even if logout fails
      if (banListenerRef.current) {
        banListenerRef.current();
        banListenerRef.current = null;
      }

      // Even if logout fails, reset the state to force redirect
      setUser(null);
      setUserData(null);
      setIsAuthenticated(false);
      setIsBanned(true);
      setIsAdmin(false);
      setBanInfo(bannedUserData.banInfo || {});
    }
  };

  const startPeriodicBanCheck = () => {
    // Fallback method: check ban status every 30 seconds
    const intervalId = setInterval(async () => {
      if (!auth.currentUser) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        const userData = await authService.getUserData(auth.currentUser.uid);
        if (userData && userData.status === 'banned') {
          console.log('Ban detected via periodic check (mobile)');
          clearInterval(intervalId);
          handleImmediateBanLogout(userData);
        }
      } catch (error) {
        console.warn('Periodic ban check error (mobile):', error);
        // Continue checking - don't stop on errors
      }
    }, 30000); // Check every 30 seconds
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userData,
        loading,
        isBanned,
        isAdmin,
        banInfo,
        showBanNotification,
        setShowBanNotification,
        login,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
