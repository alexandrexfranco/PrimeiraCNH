import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ClassSession, Vehicle } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  currentUser: User | null;
  users: User[];
  classes: ClassSession[];
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  login: (userId: string) => void;
  logout: () => void;
  updateClass: (classId: string, updates: Partial<ClassSession>) => Promise<void>;
  addClass: (session: Omit<ClassSession, 'id'>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    classes: [],
    vehicles: [],
    isLoading: true,
    error: null,
  });

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setState(s => ({ ...s, isLoading: true }));
      }
      
      const [usersRes, vehiclesRes, classesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('classes').select('*')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (vehiclesRes.error) throw vehiclesRes.error;
      if (classesRes.error) throw classesRes.error;

      // Transform snake_case from DB to camelCase for frontend
      const mappedUsers = (usersRes.data || []).map((u: any) => {
        let vehicleIdFromObs = null;
        let jobRoleFromObs = null;
        let cleanObservation = u.observation;
        if (u.observation) {
          try {
            const parsed = JSON.parse(u.observation);
            if (parsed && typeof parsed === 'object') {
              if (u.role === 'INSTRUCTOR' && parsed.vehicleId) {
                vehicleIdFromObs = parsed.vehicleId;
              }
              if (parsed.jobRole) {
                jobRoleFromObs = parsed.jobRole;
              }
              if (parsed.expiration !== undefined) {
                cleanObservation = parsed.expiration;
              } else if (Object.keys(parsed).every(k => k === 'vehicleId' || k === 'jobRole')) {
                cleanObservation = '';
              }
            }
          } catch (e) {
            // ignore
          }
        }
        return {
          ...u,
          createdAt: u.created_at,
          enrolledAt: u.enrolled_at,
          photoUrl: u.photo_url,
          vehicleId: vehicleIdFromObs,
          jobRole: jobRoleFromObs,
          observation: cleanObservation,
          created_at: undefined,
          enrolled_at: undefined,
          photo_url: undefined
        };
      }) as User[];

      const mappedVehicles = (vehiclesRes.data || []) as Vehicle[];

      const mappedClasses = (classesRes.data || []).map((c: any) => ({
        ...c,
        studentId: c.student_id,
        instructorId: c.instructor_id,
        vehicleId: c.vehicle_id,
        scheduledDate: c.scheduled_date,
        startTime: c.start_time,
        endTime: c.end_time,
        startLocation: c.start_location,
        endLocation: c.end_location,
        cancelReason: c.cancel_reason,
        cancelObservations: c.cancel_observations,
        student_id: undefined,
        instructor_id: undefined,
        vehicle_id: undefined,
        scheduled_date: undefined,
        start_time: undefined,
        end_time: undefined,
        start_location: undefined,
        end_location: undefined,
        cancel_reason: undefined,
        cancel_observations: undefined,
      })) as ClassSession[];

      let currentUser = null;
      const savedUserId = localStorage.getItem('cnh_current_user_id');
      if (savedUserId) {
        currentUser = mappedUsers.find(u => u.id === savedUserId) || null;
      }

      setState(s => ({
        ...s,
        currentUser: savedUserId ? (mappedUsers.find(u => u.id === savedUserId) || null) : s.currentUser,
        users: mappedUsers,
        classes: mappedClasses,
        vehicles: mappedVehicles,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error("Error loading data from Supabase:", err);
      setState(s => ({ ...s, isLoading: false, error: err.message || JSON.stringify(err) }));
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh silent updates every 5 seconds to automatically capture new scheduled classes
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    // Also trigger silent reload when user brings window back to focus
    const handleFocus = () => {
      loadData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = (userId: string) => {
    const user = state.users.find(u => u.id === userId) || null;
    if (user) {
      localStorage.setItem('cnh_current_user_id', user.id);
    }
    setState(s => ({ ...s, currentUser: user }));
  };

  const logout = () => {
    localStorage.removeItem('cnh_current_user_id');
    setState(s => ({ ...s, currentUser: null }));
  };

  const updateClass = async (classId: string, updates: Partial<ClassSession>) => {
    const dbUpdates: any = { ...updates };
    if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
    if (updates.instructorId !== undefined) dbUpdates.instructor_id = updates.instructorId;
    if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId;
    if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
    if (updates.startLocation !== undefined) dbUpdates.start_location = updates.startLocation;
    if (updates.endLocation !== undefined) dbUpdates.end_location = updates.endLocation;
    if (updates.cancelReason !== undefined) dbUpdates.cancel_reason = updates.cancelReason;
    if (updates.cancelObservations !== undefined) dbUpdates.cancel_observations = updates.cancelObservations;

    delete dbUpdates.studentId;
    delete dbUpdates.instructorId;
    delete dbUpdates.vehicleId;
    delete dbUpdates.scheduledDate;
    delete dbUpdates.startTime;
    delete dbUpdates.endTime;
    delete dbUpdates.startLocation;
    delete dbUpdates.endLocation;
    delete dbUpdates.cancelReason;
    delete dbUpdates.cancelObservations;

    const { error } = await supabase.from('classes').update(dbUpdates).eq('id', classId);
    if (!error) {
      setState(s => ({
        ...s,
        classes: s.classes.map(c => c.id === classId ? { ...c, ...updates } : c)
      }));
    } else {
      console.error(error);
      throw error;
    }
  };

  const addClass = async (session: Omit<ClassSession, 'id'>) => {
    const newId = uuidv4();
    const newClass: ClassSession = { ...session, id: newId };
    
    const dbInsert: any = {
      id: newId,
      student_id: session.studentId,
      instructor_id: session.instructorId,
      vehicle_id: session.vehicleId,
      scheduled_date: session.scheduledDate,
      status: session.status,
      start_time: session.startTime,
      end_time: session.endTime,
      checklist: session.checklist,
      evaluation: session.evaluation,
      cancel_reason: session.cancelReason,
      cancel_observations: session.cancelObservations,
      start_location: session.startLocation,
      end_location: session.endLocation
    };
    
    // cleanup undefined for pg
    Object.keys(dbInsert).forEach(key => dbInsert[key] === undefined && delete dbInsert[key]);

    const { error } = await supabase.from('classes').insert([dbInsert]);
    if (!error) {
      setState(s => ({ ...s, classes: [...s.classes, newClass] }));
    } else {
      console.error(error);
      throw error;
    }
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    const newId = uuidv4();
    
    // Construct the serialized JSON observation for the database
    let dbObservation = '';
    let obsObj: any = {};
    
    if (user.observation) {
      obsObj.expiration = user.observation;
    }
    if (user.role === 'INSTRUCTOR' && user.vehicleId) {
      obsObj.vehicleId = user.vehicleId;
    }
    if (user.jobRole) {
      obsObj.jobRole = user.jobRole;
    }

    if (Object.keys(obsObj).length > 0) {
      dbObservation = JSON.stringify(obsObj);
    }

    const newUser: User = { 
      ...user, 
      id: newId, 
      createdAt: new Date().toISOString()
    };
    
    const dbInsert: any = {
      ...newUser,
      observation: dbObservation || null,
      created_at: newUser.createdAt,
      enrolled_at: newUser.enrolledAt,
      photo_url: newUser.photoUrl,
    };

    delete dbInsert.createdAt;
    delete dbInsert.enrolledAt;
    delete dbInsert.photoUrl;
    delete dbInsert.vehicleId;
    delete dbInsert.jobRole;

    // cleanup undefined for pg
    Object.keys(dbInsert).forEach(key => dbInsert[key] === undefined && delete dbInsert[key]);

    const { error } = await supabase.from('users').insert([dbInsert]);

    if (!error) {
      setState(s => ({ ...s, users: [...s.users, newUser] }));
    } else {
      console.error(error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    let frontendUpdates = { ...updates };
    
    // Convert vehicleId/jobRole/observation update to observation update for database
    let dbObservation = updates.observation;
    
    if (updates.vehicleId !== undefined || updates.jobRole !== undefined || updates.observation !== undefined) {
      const currentUserObj = state.users.find(u => u.id === userId);
      let obsObj: any = {};
      
      if (currentUserObj) {
        if (currentUserObj.observation) {
          obsObj.expiration = currentUserObj.observation;
        }
        if (currentUserObj.vehicleId) {
          obsObj.vehicleId = currentUserObj.vehicleId;
        }
        if (currentUserObj.jobRole) {
          obsObj.jobRole = currentUserObj.jobRole;
        }
      }
      
      if (updates.observation !== undefined) {
        if (updates.observation) obsObj.expiration = updates.observation;
        else delete obsObj.expiration;
      }
      
      if (updates.vehicleId !== undefined) {
        if (updates.vehicleId) obsObj.vehicleId = updates.vehicleId;
        else delete obsObj.vehicleId;
      }
      
      if (updates.jobRole !== undefined) {
        if (updates.jobRole) obsObj.jobRole = updates.jobRole;
        else delete obsObj.jobRole;
      }
      
      dbObservation = Object.keys(obsObj).length > 0 ? JSON.stringify(obsObj) : '';
    }

    const dbUpdates: any = { ...updates };
    if (dbObservation !== undefined) {
      dbUpdates.observation = dbObservation;
    }
    
    if (updates.enrolledAt !== undefined) dbUpdates.enrolled_at = updates.enrolledAt;
    if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
    if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
    
    delete dbUpdates.enrolledAt;
    delete dbUpdates.photoUrl;
    delete dbUpdates.createdAt;
    delete dbUpdates.vehicleId;
    delete dbUpdates.jobRole;

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);
    if (!error) {
      setState(s => {
        const newUsers = s.users.map(u => u.id === userId ? { ...u, ...frontendUpdates } : u);
        const newCurrentUser = s.currentUser?.id === userId ? { ...s.currentUser, ...frontendUpdates } : s.currentUser;
        return { ...s, users: newUsers, currentUser: newCurrentUser };
      });
    } else {
      console.error(error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      setState(s => ({
        ...s,
        users: s.users.filter(u => u.id !== userId)
      }));
    } else {
      console.error(error);
      throw error;
    }
  };

  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    const newId = uuidv4();
    const newVehicle: Vehicle = { ...vehicle, id: newId };
    
    const { error } = await supabase.from('vehicles').insert([newVehicle]);
    if (!error) {
      setState(s => ({ ...s, vehicles: [...s.vehicles, newVehicle] }));
      return newVehicle;
    } else {
      console.error(error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ ...state, login, logout, updateClass, addClass, addUser, updateUser, deleteUser, addVehicle, refreshData: loadData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
