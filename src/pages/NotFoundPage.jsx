import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E5E0D8] text-brand-text-secondary flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-brand-text-primary tracking-tight mb-2">
        404 &middot; Página No Encontrada
      </h1>
      <p className="text-xs text-brand-text-secondary max-w-sm mb-6 leading-relaxed">
        La ruta solicitada no existe o fue trasladada dentro del sistema.
      </p>
      <Link to="/app">
        <Button variant="primary" className="text-xs gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio del CRM
        </Button>
      </Link>
    </div>
  );
}
