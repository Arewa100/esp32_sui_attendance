/**
 * Reusable background image component with mirror effect
 * Used across all pages for consistent visual design
 */
export default function PageBackground() {
  return (
    <div className="fixed inset-0 -z-[1] pointer-events-none">
      {/* Background Image with Opacity Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-30"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1753546466496-d2d8a819f61a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
          transform: 'scaleX(-1)', // Mirror effect
        }}
      />
      {/* Gradient overlay to maintain page colors */}
      <div className="absolute inset-0 bg-background/20 dark:bg-background/40" />
    </div>
  );
}

