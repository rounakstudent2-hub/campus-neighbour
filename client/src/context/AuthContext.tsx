import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile, CustomerProfile } from '../types';
import { api } from '../services/api';
import { detectStateFromLocation } from '../utils/location';

interface UserLocation {
  lat: number;
  lng: number;
  locality?: string;
  city?: string;
  state?: string;
}

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | CustomerProfile | null;
  token: string | null;
  isLoading: boolean;
  unreadNotifications: number;
  userLocation: UserLocation | null;
  setUserLocation: (loc: UserLocation | null) => void;
  requestCurrentLocation: () => Promise<UserLocation | null>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  updateProfile: (payload: any) => Promise<boolean>;
  loginAsDemo: (demoEmail: string, role: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | CustomerProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : { lat: 12.9716, lng: 77.5946, locality: 'Bengaluru Central' };
  });

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      if (data.success) {
        setUser(data.user);
        setProfile(data.profile);
        setUnreadNotifications(data.unreadNotifications || 0);
        if (data.user.latitude && data.user.longitude) {
          const loc: UserLocation = {
            lat: data.user.latitude,
            lng: data.user.longitude,
            locality: data.user.locality,
            city: data.user.city,
            state: data.user.state || detectStateFromLocation({ locality: data.user.locality, city: data.user.city, pincode: data.user.pincode, lat: data.user.latitude, lng: data.user.longitude })
          };
          setUserLocation(loc);
          localStorage.setItem('user_location', JSON.stringify(loc));
        }
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const requestCurrentLocation = async (): Promise<UserLocation | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const detectedState = detectStateFromLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          const loc: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            locality: 'Current GPS Location',
            state: detectedState
          };
          setUserLocation(loc);
          localStorage.setItem('user_location', JSON.stringify(loc));
          resolve(loc);
        },
        (error) => {
          console.warn('Geolocation denied or unavailable:', error.message);
          resolve(null);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    });
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await api.login({ email, password });
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setProfile(data.profile);
        if (data.user.latitude && data.user.longitude) {
          const loc: UserLocation = {
            lat: data.user.latitude,
            lng: data.user.longitude,
            locality: data.user.locality,
            city: data.user.city,
            state: data.user.state || detectStateFromLocation({ locality: data.user.locality, city: data.user.city, pincode: data.user.pincode, lat: data.user.latitude, lng: data.user.longitude })
          };
          setUserLocation(loc);
          localStorage.setItem('user_location', JSON.stringify(loc));
        }
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const register = async (payload: any): Promise<boolean> => {
    try {
      const data = await api.register(payload);
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const loginAsDemo = async (demoEmail: string, role: string): Promise<boolean> => {
    let password = 'password123';
    if (role === 'admin') password = 'admin123';
    else if (role === 'student') password = 'student123';
    else if (role === 'neighbor') password = 'neighbor123';
    return await login(demoEmail, password);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const updateProfile = async (payload: any): Promise<boolean> => {
    try {
      const data = await api.updateProfile(payload);
      if (data.success && data.user) {
        setUser(data.user);
        await refreshUser();
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        unreadNotifications,
        userLocation,
        setUserLocation,
        requestCurrentLocation,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        updateProfile,
        loginAsDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
