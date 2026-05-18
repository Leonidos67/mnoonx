import React, { ReactNode } from 'react';

interface MainContainerProps {
  children: ReactNode;
}

const MainContainer: React.FC<MainContainerProps> = ({ children }) => {
  return (
    <main className="flex-1 overflow-auto bg-neutral-50">
      {children}
    </main>
  );
};

export default MainContainer;