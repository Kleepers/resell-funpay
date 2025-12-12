import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { funpayApi, type ParseResult } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Package, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [lastParseResult, setLastParseResult] = useState<ParseResult | null>(null)

  const { data: lotsData, isLoading: isLoadingLots } = useQuery({
    queryKey: ['lots', { page: 1, limit: 1 }],
    queryFn: () => funpayApi.getLots(1, 1),
  })

  const { data: activeLotsData } = useQuery({
    queryKey: ['lots', { page: 1, limit: 1, isActive: true }],
    queryFn: () => funpayApi.getLots(1, 1, true),
  })

  const parseMutation = useMutation({
    mutationFn: funpayApi.parse,
    onSuccess: (response) => {
      setLastParseResult(response.data)
      toast.success(`Спарсено: ${response.data.parsed}, новых: ${response.data.new}`)
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
    onError: () => {
      toast.error('Ошибка парсинга')
    },
  })

  const handleParse = () => {
    parseMutation.mutate()
  }

  const totalLots = lotsData?.data.meta.total ?? 0
  const activeLots = activeLotsData?.data.meta.total ?? 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Обзор спарсенных лотов FunPay
          </p>
        </div>
        <Button
          onClick={handleParse}
          disabled={parseMutation.isPending}
          className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
        >
          <RefreshCw className={`h-4 w-4 ${parseMutation.isPending ? 'animate-spin' : ''}`} />
          {parseMutation.isPending ? 'Парсинг...' : 'Запустить парсинг'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/80 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего лотов
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingLots ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalLots
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              В базе данных
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активных
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {isLoadingLots ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                activeLots
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Доступны на FunPay
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Неактивных
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {isLoadingLots ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalLots - activeLots
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Сняты с продажи
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Статус парсера
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={parseMutation.isPending ? 'warning' : 'success'}>
                {parseMutation.isPending ? 'Работает' : 'Готов'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              К запуску
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Parse Result */}
      {lastParseResult && (
        <Card className="bg-gradient-to-br from-violet-500/5 to-purple-600/5 border-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              Результат последнего парсинга
            </CardTitle>
            <CardDescription>
              Статистика последней операции парсинга
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-background/50">
                <span className="text-2xl font-bold">{lastParseResult.parsed}</span>
                <span className="text-sm text-muted-foreground">Обработано</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-green-500/10">
                <span className="text-2xl font-bold text-green-500">{lastParseResult.new}</span>
                <span className="text-sm text-muted-foreground">Новых</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-blue-500/10">
                <span className="text-2xl font-bold text-blue-500">{lastParseResult.updated}</span>
                <span className="text-sm text-muted-foreground">Обновлено</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-yellow-500/10">
                <span className="text-2xl font-bold text-yellow-500">{lastParseResult.deactivated}</span>
                <span className="text-sm text-muted-foreground">Деактивировано</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Часто используемые операции
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/lots'}>
            Просмотреть все лоты
          </Button>
          <Button variant="outline" onClick={() => window.open('https://funpay.com/lots/612/', '_blank')}>
            Открыть FunPay
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
