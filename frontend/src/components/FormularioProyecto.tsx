import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Proyecto } from '../types';
import { FileText, Target, Lightbulb, Settings2, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface FormularioProyectoProps {
  proyecto?: Proyecto;
  onSubmit: (proyecto: Partial<Proyecto>) => Promise<void>;
  onCancel?: () => void;
}

export const FormularioProyecto = ({ proyecto, onSubmit, onCancel }: FormularioProyectoProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Proyecto>>({
    titulo: proyecto?.titulo || '',
    descripcion: proyecto?.descripcion || '',
    objetivo_general: proyecto?.objetivo_general || '',
    objetivos_especificos: proyecto?.objetivos_especificos || '',
    justificacion: proyecto?.justificacion || '',
    metodologia: proyecto?.metodologia || '',
    resultados_esperados: proyecto?.resultados_esperados || '',
    presupuesto_estimado: proyecto?.presupuesto_estimado || undefined,
    duracion_meses: proyecto?.duracion_meses || undefined,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Convertir a número si es necesario
    if (name === 'presupuesto_estimado' || name === 'duracion_meses') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.titulo || formData.titulo.length < 5) {
      toast.error('El título debe tener al menos 5 caracteres');
      return;
    }
    
    if (!formData.descripcion || formData.descripcion.length < 20) {
      toast.error('La descripción debe tener al menos 20 caracteres');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success(proyecto ? 'Proyecto actualizado' : 'Proyecto creado', {
        description: proyecto 
          ? 'El proyecto ha sido actualizado correctamente' 
          : 'El proyecto ha sido creado como borrador'
      });
    } catch (error: any) {
      toast.error('Error', {
        description: error.response?.data?.message || 'No se pudo guardar el proyecto'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-xl">Información Básica</CardTitle>
          </div>
          <CardDescription>
            Completa los datos principales de tu proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Título del Proyecto *
            </Label>
            <Input
              id="titulo"
              name="titulo"
              type="text"
              placeholder="Ej: Sistema de gestión académica"
              value={formData.titulo}
              onChange={handleChange}
              required
              disabled={loading}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Mínimo 5 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Descripción *
            </Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Describe de manera general tu proyecto..."
              value={formData.descripcion}
              onChange={handleChange}
              required
              disabled={loading}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Mínimo 20 caracteres</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-xl">Objetivos</CardTitle>
          </div>
          <CardDescription>
            Define los objetivos general y específicos de tu proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="objetivo_general" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Objetivo General
            </Label>
            <Textarea
              id="objetivo_general"
              name="objetivo_general"
              placeholder="¿Qué buscas lograr con este proyecto?"
              value={formData.objetivo_general}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivos_especificos" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Objetivos Específicos
            </Label>
            <Textarea
              id="objetivos_especificos"
              name="objetivos_especificos"
              placeholder="Lista los objetivos específicos del proyecto (uno por línea)"
              value={formData.objetivos_especificos}
              onChange={handleChange}
              disabled={loading}
              rows={5}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-xl">Justificación y Metodología</CardTitle>
          </div>
          <CardDescription>
            Explica el porqué y cómo de tu proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="justificacion" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              Justificación
            </Label>
            <Textarea
              id="justificacion"
              name="justificacion"
              placeholder="¿Por qué es importante este proyecto?"
              value={formData.justificacion}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodologia" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              Metodología
            </Label>
            <Textarea
              id="metodologia"
              name="metodologia"
              placeholder="¿Cómo vas a desarrollar el proyecto?"
              value={formData.metodologia}
              onChange={handleChange}
              disabled={loading}
              rows={5}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-xl">Resultados y Detalles</CardTitle>
          </div>
          <CardDescription>
            Especifica los resultados esperados y otros detalles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resultados_esperados" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Resultados Esperados
            </Label>
            <Textarea
              id="resultados_esperados"
              name="resultados_esperados"
              placeholder="¿Qué esperas obtener al finalizar el proyecto?"
              value={formData.resultados_esperados}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="presupuesto_estimado" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Presupuesto (Bs.)
              </Label>
              <Input
                id="presupuesto_estimado"
                name="presupuesto_estimado"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.presupuesto_estimado || ''}
                onChange={handleChange}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracion_meses" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Duración (meses)
              </Label>
              <Input
                id="duracion_meses"
                name="duracion_meses"
                type="number"
                min="1"
                max="60"
                placeholder="6"
                value={formData.duracion_meses || ''}
                onChange={handleChange}
                disabled={loading}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="hover:bg-accent transition-all duration-200"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center">
            {loading ? 'Guardando...' : proyecto ? 'Actualizar Proyecto' : 'Crear Proyecto'}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Button>
      </div>
    </form>
  );
};


