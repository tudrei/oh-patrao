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

  useEffect(() => {
    const fetchTableData = async () => {
      if (!tableId) return

      const { data, error } = await supabase
        .from('tables')
        .select('id, restaurant_id, table_number, restaurants(name)')
        .eq('id', tableId)
        .single()

      if (error || !data) {
        setError('Mesa não encontrada. Verifique o QR Code.')
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
    if (!table || cooldown > 0) return

    const { error: insertError } = await supabase.from('call_requests').insert({
      restaurant_id: table.restaurant_id,
      table_id: table.id,
      type: type,
      status: 'pending',
    })

    if (!insertError) {
      if (type === 'service') setLastAction('Pedido solicitado!')
      if (type === 'menu') setLastAction('Cardápio solicitado!')
      if (type === 'bill') setLastAction('Conta solicitada!')
      setCooldown(120)
    } else {
      alert('Erro ao enviar chamado. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-lg font-medium">Carregando...</p>
      </div>
    )
  }

  if (error || !table) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-zinc-950 text-white">
        <h1 className="text-xl font-bold text-red-400">Atenção</h1>
        <p className="mt-2 text-white">{error}</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-zinc-950 text-white selection:bg-amber-500">
      <header className="w-full max-w-sm text-center pt-8">
        <span className="text-xs uppercase tracking-widest text-white font-semibold opacity-90">
          {table.restaurants?.name || 'Oh Patrão!'}
        </span>
        <h1 className="text-4xl font-extrabold mt-1 text-white">
          Mesa {table.table_number}
        </h1>
        <p className="text-sm text-white mt-1 opacity-90">
          Toque no botão para solicitar atendimento
        </p>
      </header>

      <div className="w-full max-w-sm flex flex-col gap-4 my-auto">
        <button
          onClick={() => sendCall('service')}
          disabled={cooldown > 0}
          className="w-full py-6 rounded-2xl bg-amber-500 text-zinc-950 font-black text-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          🍽️ Fazer Pedido
        </button>

        <button
          onClick={() => sendCall('menu')}
          disabled={cooldown > 0}
          className="w-full py-6 rounded-2xl bg-zinc-800 text-white font-bold text-xl border border-zinc-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          📖 Pedir Cardápio
        </button>

        <button
          onClick={() => sendCall('bill')}
          disabled={cooldown > 0}
          className="w-full py-6 rounded-2xl bg-zinc-900 text-white font-bold text-xl border border-zinc-800 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          🧾 Pedir a Conta
        </button>

        {cooldown > 0 && (
          <div className="text-center p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-sm font-semibold text-amber-400">{lastAction}</p>
            <p className="text-xs text-white mt-1">
              Aguarde {cooldown}s para enviar novo chamado
            </p>
          </div>
        )}
      </div>

      <footer className="pb-4 text-center">
        <p className="text-[10px] text-white font-medium tracking-wide opacity-80">
          OH PATRÃO! SISTEMA DE ATENDIMENTO
        </p>
      </footer>
    </main>
  )
}
