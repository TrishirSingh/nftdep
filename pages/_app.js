import '../styles/globals.css'
import { SessionProvider } from "next-auth/react";
//Internal import 
import { NavBar , Footer } from '../components/componentsindex';

const MyApp = ({ Component, pageProps: { session, ...pageProps } }) => (
  <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--main-bg-color)'
    }}>
      <NavBar />
      <main style={{ 
        flex: 1,
        width: '100%',
        position: 'relative'
      }}>
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  </SessionProvider>
);

export default MyApp;
