"use client"
import { useState } from "react"

export default function LeadForm({ carId }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState("")

  async function submit(e) {
    e.preventDefault()
    setOk(false); setErr("")
    try {
      const res = await fetch("http://localhost:8000/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, message, car: carId || null, source: "web"
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setOk(true); setName(""); setPhone(""); setMessage("")
    } catch (e) {
      setErr("Nu s-a putut trimite mesajul.")
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h3 className="text-lg font-semibold mb-3">Solicită consultanță</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="input" placeholder="Nume" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="input" placeholder="Telefon" value={phone} onChange={e=>setPhone(e.target.value)} required />
        <textarea className="input sm:col-span-2 min-h-[96px]" placeholder="Mesaj (opțional)" value={message} onChange={e=>setMessage(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn" type="submit">Trimite</button>
        {ok && <span className="text-sm text-green-400">Trimis!</span>}
        {err && <span className="text-sm text-red-400">{err}</span>}
      </div>
    </form>
  )
}
