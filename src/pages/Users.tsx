import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, X, Save, Shield, UserCheck, UserX, Trash2 } from 'lucide-react';
import type { User } from '../types';

const emptyUser: Omit<User, 'id' | 'createdAt'> = { name: '', email: '', password: '', role: 'employee', active: true };

export default function Users() {
  const { users, createUser, updateUser, deleteUser, currentUser } = useApp();
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, 'id' | 'createdAt'>>(emptyUser);

  const openAdd = () => { setForm(emptyUser); setModal('add'); };
  const openEdit = (u: User) => { setSelected(u); setForm({ name: u.name, email: u.email, password: u.password, role: u.role, active: u.active }); setModal('edit'); };

  const handleSave = async () => {
    try {
      if (modal === 'add') {
        await createUser(form);
      } else if (modal === 'edit' && selected) {
        await updateUser(selected.id, form);
      }
      setModal(null);
    } catch (error) {
      console.error(error);
      alert('No se pudo guardar el usuario.');
    }
  };

  const toggleActive = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    try {
      await updateUser(id, { ...user, active: !user.active });
    } catch (error) {
      console.error(error);
      alert('No se pudo cambiar el estado del usuario.');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser.id) return;
    try {
      await deleteUser(id);
    } catch (error) {
      console.error(error);
      alert('No se pudo eliminar el usuario.');
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="font-semibold text-slate-800">Lista de Usuarios</h3>
        {currentUser.role === 'admin' ? (
          <button onClick={openAdd} className="btn-primary"><Plus size={18} />Nuevo Usuario</button>
        ) : (
          <p className="text-sm text-slate-500">Solo los administradores pueden crear, editar y eliminar usuarios.</p>
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
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => toggleActive(u.id)} className={`p-1.5 rounded-lg ${u.active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`}>
                        {u.active ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      {u.id !== currentUser.id && (
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
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

      <div className="card border-l-4 border-blue-400">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Permisos por Rol</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              role: 'Administrador', color: 'blue',
              perms: ['Gestionar inventario completo', 'Configurar precios', 'Generar reportes estratégicos', 'Gestionar usuarios y roles', 'Conectar plataformas externas']
            },
            {
              role: 'Empleado', color: 'emerald',
              perms: ['Registrar ventas locales', 'Emitir recibos', 'Consultar inventario', 'Actualizar stock básico']
            }
          ].map(r => (
            <div key={r.role} className={`bg-${r.color}-50 rounded-xl p-4`}>
              <h4 className={`font-semibold text-${r.color}-700 mb-2`}>{r.role}</h4>
              <ul className="space-y-1">
                {r.perms.map((p, i) => (
                  <li key={i} className={`text-sm text-${r.color}-600 flex items-center gap-2`}>
                    <span className={`w-1.5 h-1.5 bg-${r.color}-500 rounded-full`} />{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold">{modal === 'add' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
              <button onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
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
              <div className="flex items-center gap-3">
                <input
                  id="activeToggle"
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activeToggle" className="text-sm font-medium text-slate-700">
                  {form.active ? 'Activo' : 'Inactivo'}
                </label>
              </div>
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
