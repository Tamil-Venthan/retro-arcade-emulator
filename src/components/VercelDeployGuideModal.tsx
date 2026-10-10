import React from 'react';

interface VercelDeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployGuideModal: React.FC<VercelDeployGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="text-xl">▲</span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Deploy to Vercel</h2>
              <p className="text-xs text-slate-400">Preconfigured for global edge CDN & instant load times</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300">
            <span className="font-bold">✓ Ready for Production:</span> A preconfigured <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-white font-mono">vercel.json</code> file is included in your project root with SPA client rewrites and immutable asset caching.
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Option A: Deploy via GitHub & Vercel Dashboard</h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
              <li>Push your repository to GitHub or GitLab.</li>
              <li>Log in to <span className="text-white font-medium">vercel.com</span> and click <span className="text-white font-medium">&quot;Add New Project&quot;</span>.</li>
              <li>Select your repository. Vercel automatically detects Vite with framework preset.</li>
              <li>Click <span className="text-emerald-400 font-semibold">&quot;Deploy&quot;</span>! Your retro arcade will be live worldwide in ~30 seconds.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm">Option B: Deploy via Vercel CLI</h4>
            <p className="text-slate-400">Run the following commands in your project terminal:</p>
            <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-amber-300 border border-slate-800 space-y-1">
              <div># 1. Install Vercel CLI (if not already installed)</div>
              <div className="text-white">npm i -g vercel</div>
              <div className="pt-1"># 2. Deploy directly to production</div>
              <div className="text-emerald-400">vercel --prod</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-slate-400">
            <span className="font-semibold text-slate-200">Built-in configuration summary:</span>
            <div>• Build Command: <code className="text-slate-300 font-mono">npm run build</code></div>
            <div>• Output Directory: <code className="text-slate-300 font-mono">dist</code></div>
            <div>• Client Router: All routes rewrite to <code className="text-slate-300 font-mono">index.html</code></div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
