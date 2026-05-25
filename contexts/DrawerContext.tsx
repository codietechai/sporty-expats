import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DrawerContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

interface DrawerProviderProps {
  children: ReactNode;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => {
    console.log('DrawerContext: Opening drawer');
    setIsDrawerOpen(true);
  };
  
  const closeDrawer = () => {
    console.log('DrawerContext: Closing drawer');
    setIsDrawerOpen(false);
  };
  
  const toggleDrawer = () => {
    console.log('DrawerContext: Toggling drawer, current state:', isDrawerOpen);
    setIsDrawerOpen(!isDrawerOpen);
  };

  console.log('DrawerProvider: Current drawer state:', isDrawerOpen);

  return (
    <DrawerContext.Provider value={{ isDrawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
};