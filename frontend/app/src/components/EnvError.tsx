import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface EnvErrorProps {
  missing: string[];
}

export function EnvError({ missing }: EnvErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Configuration Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The application is missing required environment variables. Please check your deployment configuration.
          </p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-semibold mb-2">Missing variables:</p>
            <ul className="list-disc list-inside space-y-1">
              {missing.map((key) => (
                <li key={key} className="text-sm font-mono">
                  {key}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
            <p className="text-sm font-semibold mb-2">How to fix:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to your Vercel project settings</li>
              <li>Navigate to Environment Variables</li>
              <li>Add the missing variables for Production environment</li>
              <li>Redeploy the application</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

