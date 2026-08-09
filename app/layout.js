import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import ChatWidget from "@/components/ChatWidget";

export const metadata = {
  title: "Imprim Boutik — la boutique des imprimeurs",
  description: "Impression numérique grand format : bâches, vinyles, toiles et panneaux rigides.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
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
