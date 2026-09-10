import AppRoutes from './routes/AppRoutes';

/**
 * Titik masuk komponen aplikasi.
 * Penyediaan context (AuthProvider) dan router (BrowserRouter) dilakukan
 * di main.jsx agar App tetap ringkas dan mudah diuji.
 */
const App = () => <AppRoutes />;

export default App;
