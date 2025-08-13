import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AlertProvider } from '../components/AlertProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body>
          <AlertProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </div>
          </AlertProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
