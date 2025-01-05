import { useEffect, useState } from 'react';
import { checkUserSession } from '../firebase'; // Überprüft die Benutzersitzung
import Navbar from '../../components/Navbar'; // Navbar-Komponente
import Footer from '../../components/Footer'; // Footer-Komponente
import "@/styles/global.css";

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  // Effekt zur Überprüfung der Benutzersitzung
  useEffect(() => {
    const unsubscribe = checkUserSession((loggedInUser) => {
      setUser(loggedInUser);
    });

    return () => unsubscribe && unsubscribe(); // Cleanup (falls erforderlich)
  }, []);

  return (
    <>
      {/* Navbar mit Benutzerinformationen */}
      <Navbar user={user} />
      
      {/* Layout-Container für Sticky Footer */}
      <div className="layout-container">
        {/* Hauptkomponente */}
        <main className="main-content">
          <Component {...pageProps} user={user} />
        </main>
        {/* Footer */}
        
      </div>
      <Footer />
    </>
  );
}

export default MyApp;
