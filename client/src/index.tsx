import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

console.log('Starting React app...');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
} else {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  console.log('Creating React root...');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('React app rendered');
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
