'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

  // Temporizador decrescente do cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendCall = async (type: 'service' | 'bill') => {
    if (!table || cooldown > 0) return

    const { error: insertError } = await supabase.from('call_requests').insert({
      restaurant_id: table.restaurant_id,
      table_id: table.id,
      type: type,
      status: 'pending',
    })

    if (!insertError) {
      setLastAction(type === 'bill' ? 'Conta solicitada!' : 'Garçom chamado!')
      setCooldown(120) // 2 minutos de intervalo
    } else {
      alert('Erro ao enviar chamado. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-lg">Carregando...</p>
      </div>
    )
  }

  if (error || !table) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-zinc-950 text-zinc-100">
        <h1 className="text-xl font-bold text-red-500">Atenção</h1>
        <p className="mt-2 text-zinc-400">{error}</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 bg-zinc-950 text-zinc-100 selection:bg-amber-500">
      {/* Cabeçalho */}
      <header className="w-full max-w-sm text-center pt-8">
        <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">
          {table.restaurants?.name || 'Oh Patrão!'}
        </span>
        <h1 className="text-4xl font-extrabold mt-1">Mesa {table.table_number}</h1>
        <p className="text-xs text-zinc-400 mt-1">Toque no botão para solicitar atendimento</p>
      </header>

      {/* Botões de Ação */}
      <div className="w-full max-w-sm flex flex-col gap-5 my-auto">
        <button
          onClick={() => sendCall('service')}
          disabled={cooldown > 0}
          className="w-full py-8 rounded-2xl bg-amber-500 text-zinc-950 font-black text-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          🙋 Chamar Garçom
        </button>

        <button
          onClick={() => sendCall('bill')}
          disabled={cooldown > 0}
          className="w-full py-8 rounded-2xl bg-zinc-800 text-zinc-100 font-bold text-xl border border-zinc-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          🧾 Pedir a Conta
        </button>

        {cooldown > 0 && (
          <div className="text-center p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-sm font-semibold text-amber-400">{lastAction}</p>
            <p className="text-xs text-zinc-400 mt-1">
              Aguarde {cooldown}s para enviar novo chamado
            </p>
          </div>
        )}
      </div>

      {/* Rodapé discreto */}
      <footer className="pb-4 text-center">
        <p className="text-[10px] text-zinc-600 font-medium tracking-wide">
          OH PATRÃO! SISTEMA DE ATENDIMENTO
        </p>
      </footer>
    </main>
  )
}
