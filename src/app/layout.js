import Navbar from '../../components/Navbar'; // Korrigierter Pfad zu Navbar
import Footer from '../../components/Footer'; // Korrigierter Pfad zu Footer

export const metadata = {
  title: 'Social Connect',
  description: 'Eine Social Media App mit Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar /> {/* Navbar wird hier eingefügt */}
        <main>{children}</main>
        <Footer /> {/* Footer wird hier eingefügt */}
      </body>
    </html>
  );
}
