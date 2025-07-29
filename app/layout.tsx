import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body>
          <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <Navbar />
            <main className="flex-1 p-6">{children}</main>
            <Footer />
          </div>
        </body>
      </ClerkProvider>
    </html>
  );
}
