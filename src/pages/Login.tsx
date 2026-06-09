import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { users, authenticate, addUser, login, setActiveView, currentUser } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setError('');
  };

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa correo y contraseña.');
      return;
    }

    const authenticated = authenticate(email.trim(), password);
    if (!authenticated) {
      setError('Usuario no registrado o contraseña incorrecta.');
      return;
    }

    setError('');
    setActiveView('dashboard');
  };

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Completa todos los campos para registrarte.');
      return;
    }

    const emailExists = Boolean(users.find(u => u.email === email.trim()));
    if (emailExists) {
      setError('Este correo ya está registrado. Inicia sesión o usa otro correo.');
      return;
    }

    const registered = addUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      active: true,
    });

    login(registered.id);
    setError('');
    setActiveView('dashboard');
  };

  if (currentUser.id !== 'guest') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">Ya has iniciado sesión</p>
          <p className="mt-3 text-sm text-slate-500">Regresando al panel principal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <LogIn size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido a SAPPosStore</h1>
          <p className="mt-2 text-sm text-slate-500">{isRegisterMode ? 'Crea una cuenta nueva' : 'Ingresa con tu correo y contraseña'}</p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 text-sm font-medium">
            <button
              onClick={() => { setIsRegisterMode(false); resetForm(); }}
              className={`flex-1 rounded-2xl py-2 ${!isRegisterMode ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); resetForm(); }}
              className={`flex-1 rounded-2xl py-2 ${isRegisterMode ? 'bg-white shadow-sm' : 'text-slate-500'}`}
            >
              Registrarse
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {isRegisterMode && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Nombre completo</label>
              <input
                className="input-field w-full"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Nombre completo"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Correo electrónico</label>
            <input
              type="email"
              className="input-field w-full"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Contraseña</label>
            <input
              type="password"
              className="input-field w-full"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Contraseña"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Rol</label>
              <select
                className="input-field w-full"
                value={role}
                onChange={event => setRole(event.target.value as 'admin' | 'employee')}
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          )}

          <button
            onClick={isRegisterMode ? handleRegister : handleLogin}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn size={16} /> {isRegisterMode ? 'Registrarse' : 'Iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
