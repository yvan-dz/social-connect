import { useEffect, useState } from 'react';
import { checkUserSession } from '../firebase';
import Navbar from '../../components/Navbar';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUserSession((loggedInUser) => {
      setUser(loggedInUser);
    });
  }, []);

  return (
    <>
      <Navbar user={user} />
      <Component {...pageProps} user={user} />
    </>
  );
}

export default MyApp;
