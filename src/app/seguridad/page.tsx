'use client';

import React from 'react';

const SecurityPage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#212529',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Página de Seguridad</h1>
      <p style={{ fontSize: '1.2rem', textAlign: 'center', maxWidth: '600px' }}>
        Esta página está diseñada para proteger los cambios realizados en el proyecto. Por favor, asegúrate de que cualquier modificación sea intencional y esté respaldada.
      </p>
      <button
        style={{
          marginTop: '2rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          color: '#fff',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        onClick={() => alert('Cambios protegidos correctamente.')}
      >
        Confirmar Protección
      </button>
    </div>
  );
};

export default SecurityPage;