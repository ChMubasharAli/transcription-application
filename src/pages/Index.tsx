import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Redirect to the main app since this shouldn't be the entry point
    window.location.replace('/');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Redirecting...</h1>
        <p className="text-xl text-muted-foreground">Loading your PREP SMART CCL app...</p>
      </div>
    </div>
  );
};

export default Index;
