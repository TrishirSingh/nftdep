import '../styles/globals.css'
//Internal import 
import { NavBar , Footer } from '../components/componentsindex';

const MyApp = ({ Component, pageProps }) => (
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
);

export default MyApp;
