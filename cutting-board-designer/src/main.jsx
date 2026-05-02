import React from 'react';
import { createRoot } from 'react-dom/client';
import CuttingBoardDesigner from './CuttingBoardDesigner.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CuttingBoardDesigner />
  </React.StrictMode>
);
