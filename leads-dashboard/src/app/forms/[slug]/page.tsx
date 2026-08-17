import Link from 'next/link';

export default function Page({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-space-theme flex flex-col items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 flex flex-col space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center border border-white/10">
            <span className="text-xl font-bold text-accent">L</span>
          </div>
          <h1 className="text-xl font-semibold text-theme-text-primary">LEADS Next Gen Centre</h1>
          <span className="text-xs px-2.5 py-1 bg-accent/15 text-accent rounded-full font-medium">Public Feedback Form</span>
        </div>
        
        <div className="border-t border-theme-border/50 pt-6">
          <h2 className="text-lg font-medium text-theme-text-primary mb-4">Form: {params.slug}</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-1">Your Name</label>
              <input type="text" className="w-full px-4 py-2.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-1">Your Email</label>
              <input type="email" className="w-full px-4 py-2.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent" placeholder="Enter your email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-1">Feedback / Remarks</label>
              <textarea rows={4} className="w-full px-4 py-2.5 bg-theme-background/50 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent" placeholder="Provide your detailed feedback" />
            </div>
            <button type="button" className="w-full py-3 bg-accent text-white font-medium rounded-xl hover:bg-primary-light transition-all shadow-lg shadow-accent/20">
              Submit Response
            </button>
          </form>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-theme-text-secondary">
        <p>© 2026 LEADS Next Gen Centre, MSRUAS. All rights reserved.</p>
      </div>
    </div>
  );
}
