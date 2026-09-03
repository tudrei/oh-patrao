```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  Utensils,
  BookOpen,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock3,
  BellRing,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

const supabase = createClient(
  'https://wqrjvgmhqcaxskspatwv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoid3Fyaml2Z21ocWF4c2tzc3BhdHd2IiwiaWF0IjoxNzg4NDEzNTEsImV4cCI6MjEwNDAxNzM1MX0.BZzf2mCcBS5V56dLA5bmKsW7d9jdyxZqUAT2IwRsQkI'
)

interface TableInfo {
  id: string
  restaurant_id: string
  table_number: string
  restaurants?: {
    name: string
  }
}

type CallType = 'service' | 'bill' | 'menu'

export default function TablePage() {
  const params = useParams()
  const tableId = params.tableId as string

  const [table, setTable] = useState<TableInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchTableData = async () => {
      if (!tableId) return

      const { data, error } = await supabase
        .from('tables')
        .select('id, restaurant_id, table_number, restaurants(name)')
        .eq('id', tableId)
        .single()

      if (error || !data) {
        setError('Mesa não localizada. Por favor, escaneie o QR Code novamente.')
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
      setCooldown((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  const sendCall = async (type: CallType) => {
    if (!table || cooldown > 0 || submitting) return

    setSubmitting(true)
    setSuccess(false)

    const { error: insertError } = await supabase
      .from('call_requests')
      .insert({
        restaurant_id: table.restaurant_id,
        table_id: table.id,
        type,
        status: 'pending',
      })

    if (!insertError) {
      const messages = {
        service: 'Garçom chamado!',
        menu: 'Cardápio solicitado!',
        bill: 'Conta solicitada!',
      }

      setLastAction(messages[type])
      setCooldown(90)
      setSuccess(true)
    } else {
      setError('Não foi possível registrar sua solicitação. Tente novamente.')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>

          <p className="mt-5 text-sm font-semibold text-slate-800">
            Preparando sua mesa...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Só um instante
          </p>
        </div>
      </main>
    )
  }

  if (error || !table) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
            Mesa não localizada
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {error || 'Não foi possível identificar esta mesa.'}
          </p>

          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
            Escaneie novamente o QR Code disponível na mesa.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 sm:px-6">

        {/* HEADER */}
        <header className="pt-3 text-center">

          <div className="flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 shadow-lg shadow-slate-900/10">
              <BellRing className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {table.restaurants?.name || 'Oh Patrão!'}
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Mesa {table.table_number}
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
            Como podemos ajudar?
          </p>
        </header>

        {/* CONTENT */}
        <div className="my-auto py-8">

          <div className="mb-4 flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-orange-500" />

            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Solicite um atendimento
            </span>
          </div>

          <div className="space-y-3">

            {/* PEDIDO */}
            <ActionButton
              type="service"
              title="Fazer um pedido"
              description="Chamar o garçom para anotar seu pedido"
              icon={<Utensils className="h-6 w-6" />}
              onClick={() => sendCall('service')}
              disabled={cooldown > 0 || submitting}
              primary
            />

            {/* CARDÁPIO */}
            <ActionButton
              type="menu"
              title="Pedir cardápio"
              description="Solicitar o cardápio físico à equipe"
              icon={<BookOpen className="h-6 w-6" />}
              onClick={() => sendCall('menu')}
              disabled={cooldown > 0 || submitting}
            />

            {/* CONTA */}
            <ActionButton
              type="bill"
              title="Pedir a conta"
              description="Solicitar a conta e a maquininha"
              icon={<Receipt className="h-6 w-6" />}
              onClick={() => sendCall('bill')}
              disabled={cooldown > 0 || submitting}
            />

          </div>

          {/* FEEDBACK */}
          {cooldown > 0 && (
            <div
              className={`mt-4 overflow-hidden rounded-2xl border p-4 transition-all ${
                success
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-orange-200 bg-orange-50'
              }`}
            >
              <div className="flex items-center gap-3">

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    success
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {success ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock3 className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold ${
                      success
                        ? 'text-emerald-800'
                        : 'text-orange-800'
                    }`}
                  >
                    {lastAction}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Você poderá fazer uma nova solicitação em{' '}
                    <strong className="font-bold text-slate-700">
                      {cooldown}s
                    </strong>
                  </p>
                </div>

              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{
                    width: `${(cooldown / 90) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="pb-3 pt-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
            Atendimento digital
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Não é necessário chamar o garçom
          </p>
        </footer>

      </div>
    </main>
  )
}

function ActionButton({
  title,
  description,
  icon,
  onClick,
  disabled,
  primary = false,
  type,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  disabled: boolean
  primary?: boolean
  type: CallType
}) {
  const styles = {
    service: {
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    menu: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    bill: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  }

  const style = styles[type]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400'
          : 'border-slate-200 bg-white text-slate-950 shadow-sm hover:border-slate-300 hover:shadow-md'
      }`}
    >

      {/* ÍCONE */}
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
          primary
            ? 'bg-white/15 text-white'
            : `${style.iconBg} ${style.iconColor}`
        }`}
      >
        {icon}
      </div>

      {/* TEXTO */}
      <div className="min-w-0 flex-1">

        <h2
          className={`text-base font-bold ${
            primary ? 'text-white' : 'text-slate-950'
          }`}
        >
          {title}
        </h2>

        <p
          className={`mt-0.5 text-xs leading-relaxed ${
            primary
              ? 'text-orange-950/70'
              : 'text-slate-500'
          }`}
        >
          {description}
        </p>

      </div>

      {/* SETA */}
      <div
        className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
          primary
            ? 'text-white/60'
            : 'text-slate-300'
        }`}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </div>

    </button>
  )
}
```
