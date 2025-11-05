export default function Footer() {
  return (
    <footer className="mt-12">
      <div className="container py-8 text-sm text-muted flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ExpertAuto. Toate drepturile rezervate.</p>
        <div className="flex items-center gap-3">
          <a href="#" className="hover:opacity-80">Facebook</a>
          <a href="#" className="hover:opacity-80">Instagram</a>
          <a href="#" className="hover:opacity-80">Telegram</a>
        </div>
      </div>
    </footer>
  )
}
