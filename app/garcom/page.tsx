'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wqrjvgmhqcaxskspatwv.supabase.co',
  'sb_publishable_TsWKUdaD5A6t3uwy4z8qRQ_PRnozG0V'
)
interface CallRequest {
  id: string
  restaurant_id: string
  table_id: string
  type: 'service' | 'bill'
  status: 'pending' | 'attended' | 'cancelled'
  created_at: string
  tables?: { table_number: string }
}

export default function GarcomDashboard() {
  const [calls, setCalls] = useState<CallRequest[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Função para apitar sem precisar de arquivo externo
  const playBeep = () => {
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioContextRef.current = ctx
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.error('Erro ao tocar som:', e)
    }
  }

  const enableAudio = () => {
    playBeep()
    setAudioEnabled(true)
  }

  useEffect(() => {
    // Busca chamados pendentes
    const fetchPendingCalls = async () => {
      const { data } = await supabase
        .from('call_requests')
        .select('*, tables(table_number)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data) setCalls(data as CallRequest[])
    }

    fetchPendingCalls()

    // Escuta em tempo real
    const channel = supabase
      .channel('realtime-garcom')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_requests',
        },
        async (payload) => {
          const { data: tableData } = await supabase
            .from('tables')
            .select('table_number')
            .eq('id', payload.new.table_id)
            .single()

          const newCall: CallRequest = {
            ...payload.new as CallRequest,
            tables: tableData || undefined,
          }

          setCalls((prev) => [newCall, ...prev])
          playBeep()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_requests',
        },
        (payload) => {
          if (payload.new.status !== 'pending') {
            setCalls((prev) => prev.filter((call) => call.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleAttend = async (callId: string) => {
    await supabase
      .from('call_requests')
      .update({ status: 'attended', attended_at: new Date().toISOString() })
      .eq('id', callId)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', padding: '24px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Painel do Garçom</h1>
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '4px 0 0' }}>
            {calls.length} chamado(s) aguardando
          </p>
        </div>

        {!audioEnabled ? (
          <button
            onClick={enableAudio}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: '#000',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            🔊 Ativar Som
          </button>
        ) : (
          <span style={{ color: '#22c55e', fontSize: '0.875rem' }}>● Som Ativo</span>
        )}
      </header>

      {calls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#71717a' }}>
          <p style={{ fontSize: '1.25rem' }}>Nenhum chamado pendente</p>
          <p style={{ fontSize: '0.875rem' }}>Aguardando solicitações das mesas...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {calls.map((call) => {
            const isBill = call.type === 'bill'
            return (
              <div
                key={call.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: '#18181b',
                  borderLeft: `8px solid ${isBill ? '#3b82f6' : '#f59e0b'}`,
                  borderTop: '1px solid #27272a',
                  borderRight: '1px solid #27272a',
                  borderBottom: '1px solid #27272a',
                }}
              >
                <div>
                  <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>
                    Mesa {call.tables?.table_number ?? '...'}
                  </span>
                  <p style={{ margin: '6px 0 0', color: isBill ? '#60a5fa' : '#fbbf24', fontWeight: '600' }}>
                    {isBill ? '🧾 Pediu a Conta' : '🙋 Chamou Garçom'}
                  </p>
                </div>

                <button
                  onClick={() => handleAttend(call.id)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#22c55e',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Concluir
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
