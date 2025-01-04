"use client"; // Diese Zeile macht die Komponente clientseitig

import { useRouter } from 'next/navigation'; // Neuer Import für den App-Router
import { logout } from '../src/firebase'; // Dein Logout

const Navbar = ({ user }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('pages/auth/login'); // Weiterleitung nach dem Logout
  };

  return (
    <nav style={{ padding: '10px', backgroundColor: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ margin: 0, cursor: 'pointer' }} onClick={() => router.push('/')}>
          SocialConnect
        </h1>
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: '10px' }}>Willkommen, {user.email}</span>
            <button
              style={{ color: '#fff', backgroundColor: '#555', padding: '5px 10px', border: 'none', cursor: 'pointer' }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              style={{ marginLeft: '10px', color: '#fff', backgroundColor: '#555', padding: '5px 10px', border: 'none', cursor: 'pointer' }}
              onClick={() => router.push('pages/auth/login')}
            >
              Login
            </button>
            <button
              style={{ marginLeft: '10px', color: '#fff', backgroundColor: '#555', padding: '5px 10px', border: 'none', cursor: 'pointer' }}
              onClick={() => router.push('pages/auth/register')}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
