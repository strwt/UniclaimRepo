import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminViewContextType {
  isViewingAsUser: boolean;
  switchToUserView: () => void;
  switchToAdminView: () => void;
}

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

export const AdminViewProvider = ({ children }: { children: ReactNode }) => {
  const [isViewingAsUser, setIsViewingAsUser] = useState(false);

  const switchToUserView = () => {
    setIsViewingAsUser(true);
  };

  const switchToAdminView = () => {
    setIsViewingAsUser(false);
  };

  return (
    <AdminViewContext.Provider
      value={{
        isViewingAsUser,
        switchToUserView,
        switchToAdminView,
      }}
    >
      {children}
    </AdminViewContext.Provider>
  );
};

export const useAdminView = () => {
  const context = useContext(AdminViewContext);
  if (context === undefined) {
    throw new Error("useAdminView must be used within an AdminViewProvider");
  }
  return context;
};
