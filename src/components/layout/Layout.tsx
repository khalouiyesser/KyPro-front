import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
            <div className="relative">
                <Sidebar />
            </div>
            {/*
        ✅ AVANT : p-6 max-w-screen-2xl mx-auto  → beaucoup de padding partout
        ✅ APRÈS : px-2 py-3 sm:p-4 lg:p-6       → très serré sur mobile, normal sur desktop
        ✅ max-w-screen-2xl supprimé              → utilise tout l'espace disponible sur mobile
      */}
            <main className="flex-1 overflow-auto">
                <div className="px-2 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 max-w-screen-2xl lg:mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;