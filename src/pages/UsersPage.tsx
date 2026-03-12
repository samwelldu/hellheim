import React, { useEffect, useState } from 'react';
import { Trash2, Shield, Eye, EyeOff, Edit2, Check, X, Key, User } from 'lucide-react';
import { userService } from '../services/userService';
import type { AppUser, UserRole } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { getClassIconUrl } from '../utils/wowIcons';
import { clsx } from 'clsx';
import { updatePassword } from 'firebase/auth';
import { Modal } from '../components/ui/Modal';

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);

    // Create User Form State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('member');
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Change Password Form State
    const [newSelfPassword, setNewSelfPassword] = useState('');
    const [showSelfPassword, setShowSelfPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    // Alias Form State
    const [myAlias, setMyAlias] = useState('');
    const [isUpdatingAlias, setIsUpdatingAlias] = useState(false);

    // Edit Role State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [tempRole, setTempRole] = useState<UserRole>('member');

    const { user: currentUser, blizzardUser, isAdmin } = useAuth();

    // Derived State for Permissions
    const myAppUser = users.find(u =>
        (u.email && u.email === currentUser?.email) ||
        (u.accountId && u.accountId === blizzardUser?.id)
    );
    const amIPowerUser = isAdmin;

    const fetchUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            // Tan: Filtramos usuarios huérfanos que solo tienen rol pero ni email ni id de blizzard
            // Permitiendo los que tengan algun ID visible (id principal de firestore en su defecto)
            const saneData = data.filter(u => u.email || u.accountId || (u.alias && u.alias.trim() !== '') || u.id);

            // Tan: Para usuarios sin fecha, usamos un fallback numérico bajo para ordenamiento seguro si fuera necesario
            const sanitizedUsers = saneData.map(u => ({
                ...u,
                createdAt: u.createdAt || 0
            }));

            setUsers(sanitizedUsers);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Auto-provisioning + Mandatory Alias Check
    useEffect(() => {
        const checkUserStatus = async () => {
            if ((currentUser && currentUser.email) || (blizzardUser && blizzardUser.id)) {
                const usersList = await userService.getAllUsers();
                const currentId = currentUser?.email || blizzardUser?.id;

                let paramsUser = usersList.find(u => (u.email === currentId) || (u.accountId === currentId));

                // Auto-provision if missing (Solo para Firebase, Blizzard ya se auto-registra en AuthContext)
                if (!paramsUser && currentUser?.email) {
                    try {
                        const role = usersList.length === 0 ? 'admin' : 'member';
                        await userService.addUser(currentUser.email, undefined, role);
                        fetchUsers();
                    } catch (e) {
                        console.error("Error auto-adding user:", e);
                    }
                } else {
                    // Mismo saneamiento por si la carga inicial viene del check
                    // Permitiendo los que tengan algun ID visible (id principal de firestore en su defecto)
                    const saneUsersList = usersList.filter(u => u.email || u.accountId || (u.alias && u.alias.trim() !== '') || u.id);
                    setUsers(saneUsersList);
                    setLoading(false);
                }

                // Check Alias - Blocking Modal if missing (Solo para usuarios con Email)
                if (paramsUser && currentUser?.email && !paramsUser.alias) {
                    setMyAlias('');
                    setIsAliasModalOpen(true);
                }
            } else {
                fetchUsers();
            }
        };
        checkUserStatus();
    }, [currentUser, blizzardUser]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword) {
            setError("Email and Password are required.");
            return;
        }

        setIsCreating(true);
        setError(null);
        try {
            await userService.addUser(newUserEmail, newUserPassword, newUserRole);
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole('member');
            setIsCreateModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to add user');
        } finally {
            setIsCreating(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newSelfPassword) return;

        setIsChangingPassword(true);
        setPasswordMessage(null);
        try {
            await updatePassword(currentUser, newSelfPassword);
            setPasswordMessage("Contraseña actualizada correctamente.");
            setNewSelfPassword('');
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordMessage(null);
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setPasswordMessage(`Error: ${err.message}`);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleUpdateAlias = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!myAppUser || !myAppUser.id) return;

        if (!myAlias.trim()) {
            setError("El alias no puede estar vacío.");
            return;
        }

        setIsUpdatingAlias(true);
        try {
            await userService.updateUserAlias(myAppUser.id, myAlias);
            setIsAliasModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error al actualizar Alias");
        } finally {
            setIsUpdatingAlias(false);
        }
    };

    const handleDeleteUser = async (id: string, label: string) => {
        if (!amIPowerUser) return;
        if (window.confirm(`¿Seguro que quieres eliminar a ${label}?`)) {
            try {
                await userService.deleteUser(id);
                fetchUsers();
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to delete user');
            }
        }
    }

    const startEditing = (user: AppUser) => {
        setEditingUserId(user.id || null);
        setTempRole(user.role);
    };

    const cancelEditing = () => {
        setEditingUserId(null);
    };

    const saveRoleChange = async (userId: string) => {
        if (!amIPowerUser) return;
        try {
            await userService.updateUserRole(userId, tempRole);
            setEditingUserId(null);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to update role');
        }
    };

    const getRoleParams = (role: UserRole) => {
        switch (role) {
            case 'admin': return { color: 'text-void-light border-void-light/50 bg-void/10', label: 'ADMIN' };
            case 'supervisor': return { color: 'text-accent-cyan border-accent-cyan/50 bg-accent-cyan/10', label: 'SUPERVISOR' };
            default: return { color: 'text-midnight-300 border-midnight-600 bg-midnight-900', label: 'MIEMBRO' };
        }
    };

    const maskEmail = (email: string) => {
        const [name, domain] = email.split('@');
        return `${name.substring(0, 2)}••••••••@${domain}`;
    };

    const getDisplayName = (user: AppUser) => {
        if (user.accountId) return user.accountId; // BattleTag
        if (user.alias) return user.alias;
        if (user.email) return user.email;
        return user.id || 'Desconocido';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Shield className="text-void-light" />
                        Centro de Mando: Usuarios
                    </h1>
                    <p className="text-midnight-400 mt-1 uppercase text-[10px] font-black tracking-widest">
                        Gestión de Identidades y Rangos de Hellheim
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {currentUser?.email && (
                        <>
                            <button
                                onClick={() => {
                                    setMyAlias(myAppUser?.alias || '');
                                    setIsAliasModalOpen(true);
                                }}
                                className="px-4 py-2 bg-black/40 border border-white/10 hover:bg-black/60 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg"
                            >
                                <User size={18} />
                                <span className="hidden md:inline">{myAppUser?.alias || 'Sin Alias'}</span>
                            </button>

                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="px-4 py-2 bg-black/40 border border-white/10 hover:bg-black/60 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg"
                            >
                                <Key size={18} />
                            </button>
                        </>
                    )}

                    {amIPowerUser && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-6 py-2 bg-void hover:bg-void-dark text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-void/20"
                        >
                            Nuevo Oficial
                        </button>
                    )}
                </div>
            </header>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-black text-xs uppercase tracking-widest">
                    {error}
                </div>
            )}

            {/* Users List */}
            <div className="overflow-hidden glass relative">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-midnight-500 uppercase text-[10px] font-black tracking-[0.2em] border-b border-white/5">
                        <tr>
                            <th className="p-6">Identidad / BattleTag</th>
                            <th className="p-6">Personaje Principal</th>
                            <th className="p-6">Rango</th>
                            <th className="p-6">Vinculación</th>
                            <th className="p-6 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                        {loading ? (
                            <tr><td colSpan={5} className="p-20 text-center text-midnight-500 font-black animate-pulse">Consultando archivos...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-20 text-center text-midnight-600 font-black">Sin ciudadanos en Hellheim</td></tr>
                        ) : (
                            users.map(user => {
                                const isEditing = editingUserId === user.id;
                                const roleStyle = getRoleParams(user.role);
                                const canEditRole = amIPowerUser;
                                const isMe = (user.email && user.email === currentUser?.email) || (user.accountId && user.accountId === blizzardUser?.id);

                                return (
                                    <tr key={user.id} className="bg-black/40 hover:bg-black/60 transition-all duration-300 group border-b border-white/5 last:border-0">
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className={clsx("text-lg font-black tracking-tight", user.accountId ? "text-void-light" : "text-white")}>
                                                    {getDisplayName(user)}
                                                </span>
                                                {user.email && !isMe && (
                                                    <span className="text-[10px] text-midnight-600 font-mono">{maskEmail(user.email)}</span>
                                                )}
                                                {user.accountId && (
                                                    <span className="text-[9px] text-midnight-500 font-black uppercase tracking-widest">Blizzard Identity</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {user.mainCharacter ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-midnight-950 border border-midnight-700 flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={getClassIconUrl(user.mainCharacter.className) || "https://wow.zamimg.com/images/logos/wowhead-logo.png"}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/logos/wowhead-logo.png";
                                                            }}
                                                            alt={user.mainCharacter.className}
                                                            className="w-full h-full object-cover opacity-80"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-white">{user.mainCharacter.name}</span>
                                                        <span className="text-[9px] text-midnight-500 font-medium uppercase tracking-tighter">
                                                            Nivel {user.mainCharacter.level} • {user.mainCharacter.realm}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-midnight-600 font-black uppercase tracking-widest italic">Sin personaje</span>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={tempRole}
                                                        onChange={(e) => setTempRole(e.target.value as UserRole)}
                                                        className="px-3 py-1 bg-midnight-950 border border-midnight-700 rounded-lg text-xs text-white outline-none focus:border-void-light transition-colors"
                                                    >
                                                        <option value="member">Miembro</option>
                                                        <option value="supervisor">Supervisor</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button onClick={() => saveRoleChange(user.id!)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"><Check size={14} /></button>
                                                    <button onClick={cancelEditing} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={clsx("px-3 py-1 rounded-lg text-[9px] border font-black tracking-widest uppercase", roleStyle.color)}>
                                                        {roleStyle.label}
                                                    </span>
                                                    {canEditRole && !isMe && (
                                                        <button
                                                            onClick={() => startEditing(user)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-midnight-500 hover:text-white hover:bg-midnight-800 rounded-lg transition-all"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-midnight-500 text-[10px] font-black uppercase tracking-widest">
                                            {typeof user.createdAt === 'number'
                                                ? new Date(user.createdAt).toLocaleDateString()
                                                : user.createdAt?.toLocaleDateString ? user.createdAt.toLocaleDateString() : '---'}
                                        </td>
                                        <td className="p-6 text-right">
                                            {!isEditing && amIPowerUser && !isMe && (
                                                <button
                                                    onClick={() => user.id && handleDeleteUser(user.id, user.id)}
                                                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                    title="Eliminar de Hellheim"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Añadir Nuevo Usuario"
            >
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-midnight-300">Email</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-black/60 border border-white/5 rounded-xl focus:outline-none focus:border-void/50 text-white transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-midnight-500 px-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showCreatePassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/60 border border-white/5 rounded-xl focus:outline-none focus:border-void/50 text-white pr-12 transition-all"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowCreatePassword(!showCreatePassword)}
                                className="absolute right-3 top-2.5 text-midnight-500 hover:text-white transition-colors"
                            >
                                {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-midnight-500 px-1">Rol Inicial</label>
                        <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                            className="w-full px-4 py-3 bg-black/60 border border-white/5 rounded-xl focus:outline-none focus:border-void-light text-white transition-all font-black uppercase text-xs"
                        >
                            <option value="member">Miembro</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-midnight-300 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="px-6 py-2 bg-void hover:bg-void-dark text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isCreating ? 'Guardando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Cambiar Mi Contraseña"
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <p className="text-sm text-midnight-400">
                        Introduce tu nueva contraseña. Deberás volver a iniciar sesión.
                    </p>

                    {passwordMessage && (
                        <div className={clsx("p-3 rounded-lg text-sm border", passwordMessage.includes('Error') ? "bg-red-900/20 border-red-900/50 text-red-200" : "bg-green-900/20 border-green-900/50 text-green-200")}>
                            {passwordMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-midnight-300">Nueva Contraseña</label>
                        <div className="relative">
                            <input
                                type={showSelfPassword ? "text" : "password"}
                                value={newSelfPassword}
                                onChange={(e) => setNewSelfPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/60 border border-white/5 rounded-xl focus:outline-none focus:border-void/50 text-white pr-12 transition-all"
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowSelfPassword(!showSelfPassword)}
                                className="absolute right-3 top-2.5 text-midnight-500 hover:text-white transition-colors"
                            >
                                {showSelfPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsPasswordModalOpen(false)}
                            className="px-4 py-2 text-midnight-300 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="px-6 py-2 bg-void hover:bg-void-dark text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isChangingPassword ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Mandatory Alias Modal */}
            <Modal
                isOpen={isAliasModalOpen}
                onClose={() => {
                    // Prevent closing if it's mandatory (missing alias)
                    if (myAppUser?.alias) setIsAliasModalOpen(false);
                }}
                title={myAppUser?.alias ? "Editar Alias" : "¡Bienvenido! Crea tu Alias"}
            >
                <form onSubmit={handleUpdateAlias} className="space-y-4">
                    {!myAppUser?.alias && (
                        <p className="text-sm text-void-light bg-void/10 p-3 rounded-lg border border-void/30">
                            Para proteger tu identidad, usamos Alias en lugar de correos. Por favor, elige uno único para identificarte en la plataforma.
                        </p>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-midnight-300">Tu Alias (Nombre Visible)</label>
                        <input
                            type="text"
                            placeholder="Ej: Thrall, Jaina, Sylvanas"
                            value={myAlias}
                            onChange={(e) => setMyAlias(e.target.value)}
                            className="w-full px-4 py-3 bg-black/60 border border-white/5 rounded-xl focus:outline-none focus:border-void/50 text-white transition-all"
                            required
                            minLength={3}
                            maxLength={20}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        {/* Only allow cancel if alias already exists */}
                        {myAppUser?.alias && (
                            <button
                                type="button"
                                onClick={() => setIsAliasModalOpen(false)}
                                className="px-4 py-2 text-midnight-300 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isUpdatingAlias}
                            className="px-6 py-2 bg-void hover:bg-void-dark text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isUpdatingAlias ? 'Guardando...' : 'Guardar Alias'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
