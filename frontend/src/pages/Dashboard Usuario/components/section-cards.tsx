import { FileText, Clock, CheckCircle2, User } from "lucide-react"
import { EstadisticasProyecto, Usuario } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardsProps {
  estadisticas: EstadisticasProyecto | null
  loading: boolean
  usuario: Usuario | null
}

export function SectionCards({ estadisticas, loading, usuario }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="transition-colors hover:bg-muted/50 animate-fade-in">
        <CardHeader>
          <CardDescription>Total Proyectos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {loading ? '...' : estadisticas?.total || 0}
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="transition-colors hover:bg-muted/50 animate-fade-in" style={{ animationDelay: '0.05s', opacity: 0, animationFillMode: 'forwards' }}>
        <CardHeader>
          <CardDescription>En Revisión</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {loading ? '...' : (estadisticas?.enviados || 0) + (estadisticas?.en_revision || 0)}
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="transition-colors hover:bg-muted/50 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
        <CardHeader>
          <CardDescription>Aprobados</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {loading ? '...' : estadisticas?.aprobados || 0}
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="transition-colors hover:bg-muted/50 animate-fade-in" style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}>
        <CardHeader>
          <CardDescription>Mi Rol</CardDescription>
          <div className="mt-2">
            <Badge variant="secondary">
              {usuario?.rol || 'Usuario'}
            </Badge>
          </div>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <User className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </Card>
    </div>
  )
}
