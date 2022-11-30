import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import '../../configureAmplify';
import { Auth, Hub } from 'aws-amplify';

const Navbar = () => {
  const [signedUser, setSignedUser] = useState(false);

  useEffect(() => {
    authListener();
  }, []);

  async function authListener() {
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signIn':
          return setSignedUser(true);
        case 'signOut':
          return setSignedUser(false);
      }
    });

    try {
      await Auth.currentAuthenticatedUser();
      setSignedUser(true);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <nav className="flex justify-center py-3 space-x-4 border-b bg-cyan-500 border-gray-300">
      {[
        ['Home', '/'],
        ['Create Post', '/create-post'],
        ['Profile', '/profile'],
      ].map(([title, url], index) => (
        <Link href={url} key={url}>
          <a
            href=""
            className="rounded-lg px-3 py-2 text-slate-700 font-medium  hover:text-slate-100"
          >
            {title}
          </a>
        </Link>
      ))}

      {signedUser && (
        <Link href="/my-posts">
          <a
            className="rounded-lg px-3 py-2 text-slate-700 font-medium  hover:text-slate-100"
            href=""
          >
            My Posts
          </a>
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
