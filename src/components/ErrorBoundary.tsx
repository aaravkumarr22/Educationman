import * as React from 'react';
import { ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsedError = JSON.parse(error?.message || "");
        if (parsedError.error) {
          errorMessage = `Firestore Error: ${parsedError.error} during ${parsedError.operationType} on ${parsedError.path}`;
        }
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-sm font-mono text-muted-foreground break-all">
                {errorMessage}
              </div>
              <Button 
                className="w-full" 
                onClick={() => window.location.reload()}
              >
                Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
