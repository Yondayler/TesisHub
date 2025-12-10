import { useState } from 'react';
import { Portada } from '@/types/canvas';
import { Edit2 } from 'lucide-react';

interface PortadaEditableProps {
    portada: Portada;
    onChange: (portada: Portada) => void;
    logoUrl?: string;
}

/**
 * Componente que muestra la portada directamente como una hoja editable
 * Permite editar los campos haciendo clic directamente sobre ellos
 */
export function PortadaEditable({ portada, onChange, logoUrl }: PortadaEditableProps) {
    const [editingField, setEditingField] = useState<keyof Portada | null>(null);
    const [tempValue, setTempValue] = useState<string>('');

    const handleStartEdit = (field: keyof Portada, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingField(field);
        setTempValue(portada[field] || '');
    };

    const handleSave = (field: keyof Portada) => {
        onChange({
            ...portada,
            [field]: tempValue
        });
        setEditingField(null);
        setTempValue('');
    };

    const handleCancel = () => {
        setEditingField(null);
        setTempValue('');
    };

    const EditableField = ({ 
        field, 
        value, 
        className = '',
        placeholder = '',
        multiline = false
    }: { 
        field: keyof Portada; 
        value: string; 
        className?: string;
        placeholder?: string;
        multiline?: boolean;
    }) => {
        const isEditing = editingField === field;

        if (isEditing) {
            return (
                <div className="relative inline-block">
                    {multiline ? (
                        <textarea
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className={`${className} border-2 border-blue-500 rounded px-2 py-1 bg-white resize-none text-center`}
                            placeholder={placeholder}
                            rows={3}
                            autoFocus
                            style={{ minWidth: '400px' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleSave(field);
                                } else if (e.key === 'Escape') {
                                    handleCancel();
                                }
                            }}
                            onBlur={() => {
                                // Pequeño delay para permitir click en botones
                                setTimeout(() => {
                                    if (editingField === field) {
                                        handleSave(field);
                                    }
                                }, 200);
                            }}
                        />
                    ) : (
                        <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className={`${className} border-2 border-blue-500 rounded px-2 py-1 bg-white text-center`}
                            placeholder={placeholder}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSave(field);
                                } else if (e.key === 'Escape') {
                                    handleCancel();
                                }
                            }}
                            onBlur={() => {
                                // Pequeño delay para permitir click en botones
                                setTimeout(() => {
                                    if (editingField === field) {
                                        handleSave(field);
                                    }
                                }, 200);
                            }}
                        />
                    )}
                </div>
            );
        }

        return (
            <span
                className={`${className} cursor-pointer hover:bg-gray-100 rounded px-2 py-1 relative group transition-colors inline-block`}
                onClick={(e) => handleStartEdit(field, e)}
                title="Haz clic para editar"
            >
                {value || <span className="text-gray-400 italic">{placeholder}</span>}
                <Edit2 className="h-3 w-3 absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 text-gray-500" />
            </span>
        );
    };

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-100 p-8">
            <div className="w-[210mm] h-[297mm] bg-white text-black flex flex-col items-center justify-between px-16 py-12 relative shadow-lg mx-auto">
                {/* Logo de la Universidad */}
                <div className="flex flex-col items-center pt-8">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt="Logo Universidad"
                            className="h-28 w-auto object-contain"
                        />
                    ) : (
                        <div className="h-28 w-auto flex items-center justify-center">
                            <span className="text-gray-400 text-xs">[Logo Universidad]</span>
                        </div>
                    )}
                </div>

                {/* Contenido Central */}
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl px-8">
                    {/* Universidad */}
                    <div className="text-base font-semibold mb-2">
                        <EditableField
                            field="universidad"
                            value={portada.universidad}
                            className="uppercase"
                            placeholder="Universidad Nacional Experimental..."
                        />
                    </div>

                    {/* Facultad */}
                    <div className="text-base mb-4">
                        <EditableField
                            field="facultad"
                            value={portada.facultad}
                            placeholder="Facultad de..."
                        />
                    </div>

                    {/* Carrera */}
                    <div className="text-base mb-8">
                        <EditableField
                            field="carrera"
                            value={portada.carrera}
                            placeholder="Carrera/Programa"
                        />
                    </div>

                    {/* Título del Proyecto */}
                    <div className="text-xl font-bold mb-3 leading-tight">
                        <EditableField
                            field="titulo"
                            value={portada.titulo}
                            className=""
                            placeholder="Título del Proyecto"
                            multiline={true}
                        />
                    </div>

                    {/* Subtítulo/Tipo de Proyecto */}
                    <p className="text-base font-bold mb-16">
                        Proyecto Grado II
                    </p>

                    {/* Información del Autor */}
                    <div className="space-y-1 text-base leading-relaxed">
                        <div>
                            <EditableField
                                field="autor"
                                value={portada.autor}
                                className="font-normal"
                                placeholder="Nombre del autor"
                            />
                        </div>
                        {portada.email && (
                            <div>
                                <EditableField
                                    field="email"
                                    value={portada.email || ''}
                                    className="font-normal text-sm"
                                    placeholder="email@ejemplo.com"
                                />
                            </div>
                        )}
                        <div className="mt-3">
                            <EditableField
                                field="carrera"
                                value={portada.carrera}
                                className="font-normal"
                                placeholder="Carrera"
                            />
                        </div>
                        <div>
                            <EditableField
                                field="facultad"
                                value={portada.facultad}
                                className="font-normal"
                                placeholder="Facultad"
                            />
                        </div>
                    </div>
                </div>

                {/* Pie de Página */}
                <div className="text-center pb-8">
                    <span>
                        <EditableField
                            field="ciudad"
                            value={portada.ciudad}
                            className="text-base font-normal"
                            placeholder="Ciudad"
                        />
                        {' - '}
                        <EditableField
                            field="fecha"
                            value={portada.fecha}
                            className="text-base font-normal"
                            placeholder="Fecha"
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}

