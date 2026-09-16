// Ponto de entrada: inicia o React com verificações extras em desenvolvimento.
import { StrictMode } from 'react';
// Cria a raiz que conecta a aplicação ao elemento #root do HTML.
import { createRoot } from 'react-dom/client';
// Componente principal e as duas camadas de estilo do guia.
import App from './App.jsx';
import './styles.css';
import './interactions.css';

// Renderiza o guia completo dentro da página.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
