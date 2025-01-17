import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message === 'Invalid login credentials') {
            throw new Error('Credenciales inválidas');
          }
          throw error;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          if (error.message === 'User already registered') {
            throw new Error('El usuario ya está registrado');
          }
          throw error;
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sensor Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Inicie sesión para acceder al sistema' : 'Cree una cuenta nueva'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                minLength={6}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Registrarse'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? '¿No tiene una cuenta? Regístrese' : '¿Ya tiene una cuenta? Inicie sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}