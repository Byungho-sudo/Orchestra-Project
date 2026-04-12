export default function Loading() {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl animate-pulse">
          <div className="mb-6 h-5 w-40 rounded bg-slate-200" />
  
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="mt-3 h-10 w-72 rounded bg-slate-200" />
            <div className="mt-4 h-5 w-full rounded bg-slate-200" />
            <div className="mt-2 h-5 w-5/6 rounded bg-slate-200" />
  
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="mt-3 h-5 w-24 rounded bg-slate-200" />
              </div>
  
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="mt-3 h-5 w-16 rounded bg-slate-200" />
              </div>
  
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-5 w-24 rounded bg-slate-200" />
              </div>
            </div>
  
            <div className="mt-8 rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex justify-between">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-4 w-10 rounded bg-slate-200" />
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </main>
    );
  }