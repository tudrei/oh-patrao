'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Utensils,
  BookOpen,
  Receipt,
  Check,
  Radio,
  Clock3,
  BellRing,
  Coffee,
  ChevronRight,
} from 'lucide-react'

const supabase = createClient(
  'https://wqrjvgmhqcaxskspatwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoid3Fyaml2Z21ocWF4c2tzc3BhdHd2IiwiaWF0IjoxNzg4NDEzNTEsImV4cCI6MjEwNDAxNzM1MX0.BZzf2mCcBS5V56dLA5bmKsW7d9jdyxZqUAT2IwRsQkI'
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

type Filter = 'all' | 'service' | 'menu' | 'bill'

const typeConfig = {
  service: {
    label: 'Solicitar atendimento',
    shortLabel: 'Atendimento',
    icon: Utensils,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    accent: 'bg-orange-500',
    ring: 'ring-orange-500/10',
  },
  menu: {
    label: 'Solicitar cardápio',
    shortLabel: 'Cardápio',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'bg-blue-500',
    ring: 'ring-blue-500/10',
  },
  bill: {
    label: 'Solicitar conta',
    shortLabel: 'Conta',
    icon: Receipt,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    accent: 'bg-red-500',
    ring: 'ring-red-500/10',
  },
}

export default function GarcomPage() {
  const [calls, setCalls] = useState<CallRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [now, setNow] = useState(Date.now())
  const [attending, setAttending] = useState<string | null>(null)

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
        {
          event: '*',
          schema: 'public',
          table: 'call_requests',
        },
        () => {
          fetchCalls()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Atualiza o relógio a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const markAttended = async (id: string) => {
    setAttending(id)

    const { error } = await supabase
      .from('call_requests')
      .update({
        status: 'attended',
        attended_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      setCalls((prev) => prev.filter((call) => call.id !== id))
    }

    setAttending(null)
  }

  const getElapsedTime = (createdAt: string) => {
    const diffMs = now - new Date(createdAt).getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'Agora'
    if (diffMin === 1) return '1 min'
    if (diffMin < 60) return `${diffMin} min`

    const hours = Math.floor(diffMin / 60)
    const minutes = diffMin % 60

    if (hours === 1) {
      return `${hours}h ${minutes}min`
    }

    return `${hours}h ${minutes}min`
  }

  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor(
      (now - new Date(createdAt).getTime()) / 60000
    )
  }

  const filteredCalls = useMemo(() => {
    if (filter === 'all') return calls
    return calls.filter((call) => call.type === filter)
  }, [calls, filter])

  const counts = {
    all: calls.length,
    service: calls.filter((c) => c.type === 'service').length,
    menu: calls.filter((c) => c.type === 'menu').length,
    bill: calls.filter((c) => c.type === 'bill').length,
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* HEADER */}
        <header className="mb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 shadow-sm">
                  <BellRing className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    Central do Salão
                  </h1>

                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      Sistema online
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="text-xs text-slate-500">
                      Chamados em tempo real
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <Clock3 className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Na fila
                </p>

                <p className="text-lg font-bold leading-tight text-slate-950">
                  {calls.length}{' '}
                  <span className="text-sm font-medium text-slate-500">
                    {calls.length === 1 ? 'chamado' : 'chamados'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* FILTROS */}
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label="Todos"
              count={counts.all}
            />

            <FilterButton
              active={filter === 'service'}
              onClick={() => setFilter('service')}
              label="Atendimento"
              count={counts.service}
              icon={<Utensils className="h-3.5 w-3.5" />}
            />

            <FilterButton
              active={filter === 'menu'}
              onClick={() => setFilter('menu')}
              label="Cardápio"
              count={counts.menu}
              icon={<BookOpen className="h-3.5 w-3.5" />}
            />

            <FilterButton
              active={filter === 'bill'}
              onClick={() => setFilter('bill')}
              label="Conta"
              count={counts.bill}
              icon={<Receipt className="h-3.5 w-3.5" />}
            />
          </div>
        </section>

        {/* LISTA */}
        <section className="space-y-3">

          {/* LOADING */}
          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-24 text-center shadow-sm">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

              <p className="text-sm font-semibold text-slate-700">
                Carregando chamados
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Conectando ao painel do salão...
              </p>
            </div>
          )}

          {/* EMPTY */}
          {!loading && filteredCalls.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Coffee className="h-7 w-7 text-slate-400" />
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Tudo tranquilo por aqui
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Não existem chamados pendentes no momento.
                Novas solicitações aparecerão automaticamente.
              </p>
            </div>
          )}

          {/* CALL CARDS */}
          {filteredCalls.map((call) => {
            const config = typeConfig[call.type]
            const Icon = config.icon
            const elapsed = getElapsedMinutes(call.created_at)

            const isUrgent = elapsed >= 10

            return (
              <article
                key={call.id}
                className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isUrgent
                    ? 'border-red-200'
                    : 'border-slate-200'
                }`}
              >

                {/* BARRA LATERAL */}
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${config.accent}`}
                />

                <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:justify-between sm:p-5 sm:pl-6">

                  {/* INFO */}
                  <div className="flex min-w-0 items-center gap-4">

                    {/* MESA */}
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Mesa
                      </span>

                      <span className="mt-0.5 text-2xl font-black leading-none">
                        {call.tables?.table_number || '--'}
                      </span>
                    </div>

                    <div className="min-w-0">

                      {/* TIPO */}
                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${config.bg} ${config.color} ${config.border}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>

                        {isUrgent && (
                          <span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                            Aguardando há {elapsed} min
                          </span>
                        )}
                      </div>

                      {/* HORÁRIO */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />

                        <span>
                          Recebido às{' '}
                          {new Date(call.created_at).toLocaleTimeString(
                            'pt-BR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span className="font-medium text-slate-500">
                          {getElapsedTime(call.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}
                  <button
                    onClick={() => markAttended(call.id)}
                    disabled={attending === call.id}
                    className="group/button flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {attending === call.id ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Atendendo...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Marcar atendido</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover/button:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        {/* FOOTER */}
        <footer className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Radio className="h-3.5 w-3.5" />
          <span>Atualização automática ativada</span>
        </footer>
      </div>
    </main>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  icon?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
        active
          ? 'bg-slate-950 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}

      <span>{label}</span>

      <span
        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
          active
            ? 'bg-white/10 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
