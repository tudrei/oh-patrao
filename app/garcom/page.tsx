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

  const getCallDescription = (type: string) => {
    if (type === 'menu') return '📖 Pediu o cardápio'
    if (type === 'bill') return '🧾 Pediu a conta'
    return '🍽️ Chamou para fazer pedido'
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 selection:bg-amber-500">
      <header className="max-w-2xl mx-auto mb-6 flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-amber-500">PAINEL DO GARÇOM</h1>
          <p className="text-sm text-zinc-400">Chamados em tempo real</p>
        </div>
        <span className="bg-zinc-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {calls.length} pendente(s)
        </span>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">
        {loading && <p className="text-center text-zinc-400 py-12">Carregando...</p>}

        {!loading && calls.length === 0 && (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
            <p className="text-lg font-medium text-zinc-300">Nenhum chamado pendente no momento</p>
            <p className="text-xs text-zinc-500 mt-1">Os chamados das mesas aparecerão automaticamente aqui</p>
          </div>
        )}

        {calls.map((call) => (
          <div
            key={call.id}
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
              call.type === 'bill'
                ? 'bg-red-950/30 border-red-900/50'
                : call.type === 'menu'
                ? 'bg-blue-950/30 border-blue-900/50'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white">
                  Mesa {call.tables?.table_number || '--'}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    call.type === 'bill'
                      ? 'bg-red-500 text-zinc-950'
                      : call.type === 'menu'
                      ? 'bg-blue-500 text-zinc-950'
                      : 'bg-amber-500 text-zinc-950'
                  }`}
                >
                  {getCallDescription(call.type)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {new Date(call.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>

            <button
              onClick={() => markAttended(call.id)}
              className="px-5 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 active:scale-95 transition-all text-sm"
            >
              Atendido
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
