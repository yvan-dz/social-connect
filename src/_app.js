import { useEffect, useState } from 'react';
import { checkUserSession } from '../firebase'; // Überprüft die Benutzersitzung
import Navbar from '../../components/Navbar'; // Navbar-Komponente
import '@/styles/global.css'; // Import der globalen CSS-Datei

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
      
      {/* Hauptkomponente */}
      <main style={{ padding: '20px' }}>
        <Component {...pageProps} user={user} />
      </main>
    </>
  );
}

export default MyApp;
