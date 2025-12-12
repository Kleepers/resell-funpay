import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { funpayApi, type FunPayLot } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, ChevronLeft, ChevronRight, Package } from 'lucide-react'

export default function FunPayLots() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lots', { page, limit }],
    queryFn: () => funpayApi.getLots(page, limit),
  })

  const lots = data?.data.data ?? []
  const meta = data?.data.meta

  const getServerBadge = (server: string) => {
    const serverLower = server.toLowerCase()
    if (serverLower.includes('eu')) {
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">EU</Badge>
    }
    if (serverLower.includes('na')) {
      return <Badge variant="secondary" className="bg-red-500/20 text-red-400">NA</Badge>
    }
    return <Badge variant="outline">{server}</Badge>
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <p className="text-destructive">Ошибка загрузки данных</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Лоты FunPay</h1>
          <p className="text-muted-foreground mt-1">
            Все спарсенные лоты из FunPay
          </p>
        </div>
        {meta && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Всего: {meta.total} лотов</span>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Список лотов</CardTitle>
          <CardDescription>
            Отображаются {lots.length} из {meta?.total ?? 0} лотов
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Лоты не найдены</p>
              <p className="text-sm text-muted-foreground mt-1">
                Запустите парсинг для получения данных
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Сервер</TableHead>
                  <TableHead>Ранг</TableHead>
                  <TableHead className="text-center">Агенты</TableHead>
                  <TableHead className="text-center">Скины</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead>Обновлено</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot: FunPayLot) => (
                  <TableRow key={lot.id} className="group">
                    <TableCell className="font-mono text-sm">
                      {lot.externalId}
                    </TableCell>
                    <TableCell>{getServerBadge(lot.server)}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={lot.rank}>
                      {lot.rank}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-muted text-sm">
                        {lot.agentsCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-muted text-sm">
                        {lot.skinsCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className="text-green-500">{formatPrice(lot.priceRub)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={lot.isActive ? 'success' : 'outline'}>
                        {lot.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lot.lastSeenAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(lot.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Страница {meta.page} из {meta.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Назад
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (meta.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= meta.totalPages - 2) {
                      pageNum = meta.totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  Вперёд
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
