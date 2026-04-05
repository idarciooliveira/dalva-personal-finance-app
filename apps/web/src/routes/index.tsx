import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="page-wrap flex min-h-svh items-center justify-center px-4 py-14">
      <Button>Shadcn is ready</Button>
    </main>
  );
}
