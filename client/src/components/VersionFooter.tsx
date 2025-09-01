import pkg from '../../../package.json';
const version = { build: pkg.version };

export function VersionFooter() {
  return (
    <footer className="fixed bottom-2 right-2 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded border shadow-sm z-10">
v{version.build}
    </footer>
  );
}
