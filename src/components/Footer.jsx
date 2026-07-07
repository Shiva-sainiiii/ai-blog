export default function Footer() {
  return (
    <footer className="border-t border-parchment/10 mt-24">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-lg text-parchment/80">
          <span className="text-signal">◆</span> Marginalia
        </p>
        <p className="text-sm text-parchment/50 text-center">
          Every post here is labeled honestly —{' '}
          <span className="text-clay">clay-marked</span> means AI-assisted,
          plain means written by hand.
        </p>
        <p className="text-sm text-parchment/40">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
