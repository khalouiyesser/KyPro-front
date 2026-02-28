// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './index.css';
//
// const root = ReactDOM.createRoot(
//     document.getElementById('root') as HTMLElement
// );
//
// root.render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        {/*
      ⚠️ ORDRE CRITIQUE DES PROVIDERS :
      1. QueryClientProvider  — doit être le plus haut
      2. AuthProvider         — gère l'auth (ThemeContext en dépend pour user.theme)
      3. ThemeProvider        — dépend de AuthContext pour user.theme
      4. I18nProvider         — doit être AVANT App pour que useI18n() fonctionne partout
      5. App                  — tous les hooks sont maintenant disponibles
    */}
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider>
                    <I18nProvider>
                        <App />
                    </I18nProvider>
                </ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
);