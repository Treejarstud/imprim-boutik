import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  title: "Imprim Boutik — la boutique des imprimeurs",
  description: "Impression numérique grand format : bâches, vinyles, toiles et panneaux rigides.",
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Google AdSense — ne charge que si un identifiant est configuré
            (voir NEXT_PUBLIC_ADSENSE_CLIENT_ID dans .env.local) */}
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="bg-gray-50 text-gray-900">
        <AuthProvider>
          {children}
          <AuthModal />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
