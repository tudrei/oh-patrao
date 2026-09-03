'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wqrjvgmhqcaxskspatwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxcmp2Z21ocWNheHNrc3BhdHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDEzNTEsImV4cCI6MjEwNDAxNzM1MX0.BZzf2mCcBS5V56dLA5bmKsW7d9jdyxZqUAT2IwRsQkI'
)

interface CallRequest {
  id: string
  restaurant_id: string
  table_id: string
  type: 'service' | 'bill' | 'menu'
  status: 'pending' | 'attended' | 'cancelled'
  created_at: string
  tables?: {
    table_number: string
  }
}

export default function GarcomPage() {
  const [calls, setCalls] = useState<CallRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'service' | 'menu' | 'bill'>('all')

  const fetchCalls = async () => {
    const { data, error } = await supabase
      .from('call_requests')
      .select('*, tables(table_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setCalls(data as unknown as CallRequest[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCalls()

    const channel = supabase
      .channel('realtime:call_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_requests' },
        () => {
          fetchCalls()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAttended = async (id: string) => {
    await supabase
      .from('call_requests')
      .update({ status: 'attended', attended_at: new Date().toISOString() })
      .eq('id', id)

    setCalls((prev) => prev.filter((call) => call.id !== id))
  }

  const getTypeConfig = (type: string) => {
    if (type === 'bill') {
      return {
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        border: 'border-l-rose-500',
        icon: '🧾',
        label: 'Pediu a Conta',
      }
    }
    if (type === 'menu') {
      return {
        badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        border: 'border-l-sky-500',
        icon: '📖',
        label: 'Pediu o Cardápio',
      }
    }
    return {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      border: 'border-l-amber-500',
      icon: '🍽️',
      label: 'Fazer Pedido',
    }
  }

  const getElapsedTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Agora mesmo'
    if (diffMin === 1) return 'Há 1 min'
    return `Há ${diffMin} min`
  }

  const filteredCalls = filter === 'all' ? calls : calls.filter((c) => c.type === filter)

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Central do Salão
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Ao vivo
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Atendimento e chamados em tempo real
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 text-right">
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                Fila de Espera
              </p>
              <p className="text-xl font-extrabold text-white">
                {calls.length} {calls.length === 1 ? 'mesa' : 'mesas'}
              </p>
            </div>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            Todos ({calls.length})
          </button>
          <button
            onClick={() => setFilter('service')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'service'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            🍽️ Pedidos ({calls.filter((c) => c.type === 'service').length})
          </button>
          <button
            onClick={() => setFilter('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'menu'
                ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            📖 Cardápios ({calls.filter((c) => c.type === 'menu').length})
          </button>
          <button
            onClick={() => setFilter('bill')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'bill'
                ? 'bg-rose-500 text-black shadow-md shadow-rose-500/20'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            🧾 Contas ({calls.filter((c) => c.type === 'bill').length})
          </button>
        </div>

        <div className="mt-2 space-y-3">
          {loading && (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-400">Carregando painel...</p>
            </div>
          )}

          {!loading && filteredCalls.length === 0 && (
            <div className="py-24 text-center rounded-3xl bg-zinc-950 border border-dashed border-zinc-800">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-2xl">
                ☕
              </div>
              <h2 className="text-base font-bold text-white">Nenhum chamado pendente</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Assim que algum cliente acionar a mesa, o chamado surge automaticamente aqui.
              </p>
            </div>
          )}

          {filteredCalls.map((call) => {
            const conf = getTypeConfig(call.type)
            return (
              <div
                key={call.id}
                className={`p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 border-l-8 ${conf.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-zinc-700 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Mesa
                    </span>
                    <span className="text-xl font-black text-white leading-none mt-0.5">
                      {call.tables?.table_number || '--'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${conf.badge}`}
                      >
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </span>
                      <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {getElapsedTime(call.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                      Recebido às {new Date(call.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => markAttended(call.id)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-sm tracking-wide transition-all shadow-md shadow-emerald-500/10 cursor-pointer text-center"
                >
                  Marcar como Atendido
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
