import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, X, Save, Trash2 } from 'lucide-react';
import type { User } from '../types';

const emptyUser: Omit<User, 'id' | 'createdAt'> = { name: '', email: '', password: '', role: 'employee', active: true };

export default function Users() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, 'id' | 'createdAt'>>(emptyUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openAdd = () => { setSelected(null); setForm(emptyUser); setModal('add'); setError(''); };
  const openEdit = (u: User) => { setSelected(u); setForm({ name: u.name, email: u.email, password: u.password, role: u.role, active: u.active }); setModal('edit'); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (modal === 'add') {
        await addUser(form);
      } else if (modal === 'edit' && selected) {
        await updateUser(selected.id, form);
      }
      setModal(null);
      setSelected(null);
      setError('');
    } catch (err) {
      setError('Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    setLoading(true);
    try {
      await deleteUser(id);
    } catch (err) {
      alert('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Usuarios</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-emerald-600">{users.filter(u => u.active).length}</p>
          <p className="text-sm text-slate-500 mt-1">Activos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-violet-600">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-sm text-slate-500 mt-1">Administradores</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Lista de Usuarios</h3>
        {currentUser.role === 'admin' && (
          <button onClick={openAdd} className="btn-primary"><Plus size={18} />Nuevo Usuario</button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-th">Usuario</th>
            <th className="table-th">Correo</th>
            <th className="table-th">Rol</th>
            <th className="table-th">Fecha Registro</th>
            <th className="table-th">Estado</th>
            <th className="table-th">Acciones</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="table-td text-slate-500">{u.email}</td>
                <td className="table-td">
                  <span className={u.role === 'admin' ? 'badge-info' : 'badge-success'}>
                    {u.role === 'admin' ? 'Administrador' : 'Empleado'}
                  </span>
                </td>
                <td className="table-td text-slate-500">{u.createdAt}</td>
                <td className="table-td">
                  <span className={u.active ? 'badge-success' : 'badge-danger'}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-td">
                  {currentUser.role === 'admin' && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" disabled={loading}>
                        <Pencil size={15} />
                      </button>
                      {u.id !== currentUser.id && (
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" disabled={loading}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold">{modal === 'add' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
              <button onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
                )}
                {[
                { label: 'Nombre completo', key: 'name', type: 'text' },
                { label: 'Correo electrónico', key: 'email', type: 'email' },
                { label: 'Contraseña', key: 'password', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as Record<string, unknown>)[f.key] as string}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Rol</label>
                <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value as User['role'] }))} className="input-field">
                  <option value="employee">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mt-2">
                  {error}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-100">
              <button onClick={() => setModal(null)} className="btn-secondary"><X size={16} />Cancelar</button>
              <button onClick={handleSave} className="btn-primary"><Save size={16} />Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
