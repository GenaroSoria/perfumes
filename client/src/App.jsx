import { Route, Routes } from 'react-router-dom';
import BotonWhatsApp from './components/BotonWhatsApp.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Carrito from './pages/Carrito.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Checkout from './pages/Checkout.jsx';
import Nosotros from './pages/Nosotros.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';
import PagoResultado from './pages/PagoResultado.jsx';
import Producto from './pages/Producto.jsx';

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/producto/:id" element={<Producto />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pago/exito" element={<PagoResultado tipo="exito" />} />
          <Route path="/pago/pendiente" element={<PagoResultado tipo="pendiente" />} />
          <Route path="/pago/error" element={<PagoResultado tipo="error" />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>
      <Footer />
      <BotonWhatsApp />
    </div>
  );
}
