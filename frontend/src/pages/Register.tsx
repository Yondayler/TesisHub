import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail, Lock, User, ArrowRight, Phone, CreditCard, Sparkles } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registro } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registro(formData);
      toast.success('¡Cuenta creada!', {
        description: 'Te has registrado exitosamente',
      });
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al registrar usuario';
      setError(errorMessage);
      toast.error('Error al registrar', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-100 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
        {/* Logo y título */}
        <div className="text-center space-y-3 animate-scale-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 relative group">
            <FileText className="h-8 w-8 text-white relative z-10" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Crea tu cuenta
            </h1>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              Únete al sistema de gestión de proyectos
            </p>
          </div>
        </div>

        {/* Card de registro */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm animate-slide-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold">Registro</CardTitle>
            <CardDescription className="text-sm">
              Completa el formulario para crear tu cuenta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 animate-scale-in">
                  <div className="flex gap-2">
                    <div className="font-medium">Error:</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 group">
                  <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 group-focus-within:text-purple-600 transition-colors">
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="apellido" className="text-sm font-medium text-gray-700 group-focus-within:text-purple-600 transition-colors">
                    Apellido
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <Input
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Pérez"
                      value={formData.apellido}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 group-focus-within:text-purple-600 transition-colors">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 group-focus-within:text-purple-600 transition-colors">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 group">
                  <Label htmlFor="cedula" className="text-sm font-medium text-gray-700 group-focus-within:text-purple-600 transition-colors">
                    Cédula <span className="text-gray-400 text-xs">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <Input
                      id="cedula"
                      name="cedula"
                      type="text"
                      placeholder="12345678"
                      value={formData.cedula}
                      onChange={handleChange}
                      disabled={loading}
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <Label htmlFor="telefono" className="text-sm font-medium text-gray-700 group-focus-within:text-purple-600 transition-colors">
                    Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <Input
                      id="telefono"
                      name="telefono"
                      type="text"
                      placeholder="0412-1234567"
                      value={formData.telefono}
                      onChange={handleChange}
                      disabled={loading}
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 font-medium bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Crear Cuenta
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-purple-600 hover:text-purple-700 hover:underline transition-all duration-200 inline-flex items-center gap-1 group"
                >
                  Inicia sesión aquí
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 animate-fade-in">
          <Sparkles className="h-3 w-3" />
          Sistema de Aceptación de Proyectos
        </p>
      </div>
    </div>
  );
};
