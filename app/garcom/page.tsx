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

  const fetchCalls = async () => {
    const { data, error } = await supabase
      .from('call_requests')
      .select('*, tables(table_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

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

  const getTypeStyle = (type: string) => {
    if (type === 'bill') {
      return {
        badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        card: 'border-l-4 border-l-rose-500 border-zinc-800 bg-zinc-900/90',
        icon: '🧾',
        label: 'Pediu a conta',
      }
    }
    if (type === 'menu') {
      return {
        badge: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
        card: 'border-l-4 border-l-sky-500 border-zinc-800 bg-zinc-900/90',
        icon: '📖',
        label: 'Pediu o cardápio',
      }
    }
    return {
      badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      card: 'border-l-4 border-l-amber-500 border-zinc-800 bg-zinc-900/90',
      icon: '🍽️',
      label: 'Fazer pedido',
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 antialiased selection:bg-amber-500">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between pb-6 border-b border-zinc-800/80 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">Central de Atendimento</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Ao Vivo
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Chamados em tempo real da equipe</p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-zinc-200">
              {calls.length} {calls.length === 1 ? 'pendência' : 'pendências'}
            </span>
          </div>
        </header>

        <div className="space-y-3">
          {loading && (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium text-zinc-400">Sincronizando mesas...</p>
            </div>
          )}

          {!loading && calls.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-3 text-xl">
                ✓
              </div>
              <h3 className="text-sm font-bold text-zinc-200">Tudo em dia</h3>
              <p className="text-xs text-zinc-500 mt-1">Nenhum chamado pendente no momento</p>
            </div>
          )}

          {calls.map((call) => {
            const style = getTypeStyle(call.type)
            return (
              <div
                key={call.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-4 shadow-sm ${style.card}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black tracking-tight text-white">
                      Mesa {call.tables?.table_number || '--'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.badge}`}>
                      <span>{style.icon}</span>
                      <span>{style.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                    <span>Horário do chamado:</span>
                    <span className="text-zinc-300">
                      {new Date(call.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => markAttended(call.id)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-200 font-bold text-xs tracking-wide border border-zinc-700 hover:border-emerald-500 transition-all duration-150 active:scale-95 whitespace-nowrap"
                >
                  Concluir
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
