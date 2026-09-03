'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wqrjvgmhqcaxskspatwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxcmp2Z21ocWNheHNrc3BhdHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDEzNTEsImV4cCI6MjEwNDAxNzM1MX0.BZzf2mCcBS5V56dLA5bmKsW7d9jdyxZqUAT2IwRsQkI'
)

interface TableInfo {
  id: string
  restaurant_id: string
  table_number: string
  restaurants?: {
    name: string
  }
}

export default function TablePage() {
  const params = useParams()
  const tableId = params.tableId as string

  const [table, setTable] = useState<TableInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchTableData = async () => {
      if (!tableId) return

      const { data, error } = await supabase
        .from('tables')
        .select('id, restaurant_id, table_number, restaurants(name)')
        .eq('id', tableId)
        .single()

      if (error || !data) {
        setError('Mesa não localizada. Por favor, escaneie novamente.')
      } else {
        setTable(data as unknown as TableInfo)
      }
      setLoading(false)
    }

    fetchTableData()
  }, [tableId])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendCall = async (type: 'service' | 'bill' | 'menu') => {
    if (!table || cooldown > 0 || submitting) return

    setSubmitting(true)
    const { error: insertError } = await supabase.from('call_requests').insert({
      restaurant_id: table.restaurant_id,
      table_id: table.id,
      type: type,
      status: 'pending',
    })

    if (!insertError) {
      if (type === 'service') setLastAction('Garçom chamado para pedido')
      if (type === 'menu') setLastAction('Cardápio solicitado')
      if (type === 'bill') setLastAction('Conta solicitada')
      setCooldown(90)
    } else {
      alert('Não foi possível registrar seu pedido. Tente novamente.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-wide">Carregando mesa...</p>
        </div>
      </div>
    )
  }

  if (error || !table) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <span className="text-2xl text-red-400 font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-white">QR Code Inválido</h1>
        <p className="mt-2 text-sm text-zinc-300 max-w-xs">{error}</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6 antialiased selection:bg-amber-500">
      <header className="w-full max-w-md mx-auto pt-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-3 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-semibold text-white">
            {table.restaurants?.name || 'Oh Patrão!'}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Mesa {table.table_number}
        </h1>
        <p className="text-xs text-zinc-300 mt-1">
          Toque na opção desejada para notificar nossa equipe
        </p>
      </header>

      <div className="w-full max-w-md mx-auto space-y-3.5 my-auto">
        <button
          onClick={() => sendCall('service')}
          disabled={cooldown > 0 || submitting}
          className="w-full group relative overflow-hidden rounded-2xl bg-amber-500 p-5 text-left text-zinc-950 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-amber-500/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-950/70">Atendimento</p>
              <h2 className="text-xl font-black mt-0.5">Fazer Pedido</h2>
              <p className="text-xs font-medium text-amber-950/80 mt-1">Chamar garçom para anotar seu pedido</p>
            </div>
            <span className="text-3xl opacity-90 transition-transform group-hover:scale-110">🍽️</span>
          </div>
        </button>

        <button
          onClick={() => sendCall('menu')}
          disabled={cooldown > 0 || submitting}
          className="w-full group rounded-2xl bg-zinc-900 border border-zinc-800 p-5 text-left text-white transition-all duration-200 hover:border-zinc-700 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Cardápio</p>
              <h2 className="text-xl font-bold mt-0.5">Pedir Cardápio</h2>
              <p className="text-xs text-zinc-300 mt-1">Solicitar menu físico à equipe</p>
            </div>
            <span className="text-3xl opacity-80 transition-transform group-hover:scale-110">📖</span>
          </div>
        </button>

        <button
          onClick={() => sendCall('bill')}
          disabled={cooldown > 0 || submitting}
          className="w-full group rounded-2xl bg-zinc-900 border border-zinc-800 p-5 text-left text-white transition-all duration-200 hover:border-zinc-700 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Encerramento</p>
              <h2 className="text-xl font-bold mt-0.5">Pedir a Conta</h2>
              <p className="text-xs text-zinc-300 mt-1">Trazer conta e maquininha à mesa</p>
            </div>
            <span className="text-3xl opacity-80 transition-transform group-hover:scale-110">🧾</span>
          </div>
        </button>

        {cooldown > 0 && (
          <div className="rounded-xl bg-zinc-900/90 border border-amber-500/30 p-4 text-center backdrop-blur-sm">
            <p className="text-sm font-semibold text-amber-400">{lastAction}</p>
            <p className="text-xs text-white mt-1">
              Próximo chamado liberado em {cooldown}s
            </p>
          </div>
        )}
      </div>

      <footer className="w-full max-w-md mx-auto pb-4 text-center">
        <p className="text-[10px] tracking-widest text-zinc-400 font-semibold uppercase">
          Oh Patrão! Sistema de Atendimento
        </p>
      </footer>
    </main>
  )
}
