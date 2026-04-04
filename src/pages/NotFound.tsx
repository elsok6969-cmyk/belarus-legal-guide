import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-primary">404</h1>
        <p className="mb-4 text-lg text-muted-foreground">
          Страница не найдена
        </p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          Вернуться на главную
        </a>
      </div>
    </div>
  );
}
