export function BaalFooter() {
  return (
    <footer className="py-12 border-t border-purple-500/20 bg-[#06040a]">
      <div className="container mx-auto px-6 text-center">
        <div className="text-3xl text-purple-500/50 mb-6">⚡</div>
        <p className="text-sm text-purple-300/60 font-['Cinzel'] tracking-widest">
          © {new Date().getFullYear()} BAALVION. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  )
}
