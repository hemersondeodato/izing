<template>
  <div v-if="userProfile === 'admin'">
    <q-card bordered>
      <q-card-section>
        <div class="text-h6 q-px-sm">Relatório Pesquisa de Satisfação</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <fieldset class="rounded-all">
          <legend class="q-px-sm">Filtros</legend>
          <div class="row q-gutter-md items-end">
            <div class="col-xs-12 col-md-3">
              <label>Início</label>
              <DatePick dense rounded v-model="filters.startDate" />
            </div>
            <div class="col-xs-12 col-md-3">
              <label>Final</label>
              <DatePick dense rounded v-model="filters.endDate" />
            </div>
            <div class="col-xs-12 col-md-3">
              <q-select
                outlined
                rounded
                dense
                clearable
                v-model="filters.userId"
                :options="users"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                label="Atendente"
              />
            </div>
            <div class="col-xs-12 col-md-3">
              <q-select
                outlined
                rounded
                dense
                clearable
                v-model="filters.queueId"
                :options="queues"
                option-value="id"
                option-label="queue"
                emit-value
                map-options
                label="Fila"
              />
            </div>
            <div class="col-12 text-center">
              <q-btn
                class="q-mr-sm"
                color="primary"
                rounded
                label="Gerar"
                icon="refresh"
                @click="loadReport"
              />
              <q-btn
                color="black"
                rounded
                label="Limpar"
                @click="clearFilters"
              />
            </div>
          </div>
        </fieldset>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-xs-12 col-md-4">
        <q-card bordered class="metric-card">
          <q-card-section>
            <div class="text-caption text-grey-7">Média Geral</div>
            <div class="text-h4 text-primary">{{ averageRating }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-xs-12 col-md-4">
        <q-card bordered class="metric-card">
          <q-card-section>
            <div class="text-caption text-grey-7">Total de Respostas</div>
            <div class="text-h4 text-primary">{{ totalResponses }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-xs-12 col-md-4">
        <q-card bordered class="metric-card">
          <q-card-section>
            <div class="text-caption text-grey-7">Notas 1 a 5</div>
            <div class="distribution">
              <span v-for="rating in [1,2,3,4,5]" :key="rating">
                {{ rating }}: {{ distributionMap[rating] || 0 }}
              </span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-xs-12 col-md-5">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle1">Média por Atendente</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-markup-table flat bordered separator="cell">
              <thead>
                <tr>
                  <th class="text-left">Atendente</th>
                  <th class="text-center">Média</th>
                  <th class="text-center">Respostas</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in report.averagesByUser" :key="`${item.userId}-${item.name}`">
                  <td>{{ item.name }}</td>
                  <td class="text-center">{{ formatNumber(item.averageRating) }}</td>
                  <td class="text-center">{{ item.totalResponses }}</td>
                </tr>
                <tr v-if="!report.averagesByUser.length">
                  <td colspan="3" class="text-center text-grey-7">Nenhuma resposta encontrada.</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-xs-12 col-md-7">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle1">Respostas Recebidas</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <q-markup-table flat bordered separator="cell">
              <thead>
                <tr>
                  <th class="text-left">Ticket</th>
                  <th class="text-left">Cliente</th>
                  <th class="text-left">Número</th>
                  <th class="text-center">Nota</th>
                  <th class="text-left">Atendente</th>
                  <th class="text-left">Fila</th>
                  <th class="text-left">Respondido em</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in report.responses" :key="item.id">
                  <td>#{{ item.ticketId }}</td>
                  <td>{{ item.contactName || 'Não informado' }}</td>
                  <td>{{ item.customerNumber || 'Não informado' }}</td>
                  <td class="text-center">{{ item.rating }}</td>
                  <td>{{ item.userName }}</td>
                  <td>{{ item.queueName }}</td>
                  <td>{{ formatDate(item.respondedAt) }}</td>
                </tr>
                <tr v-if="!report.responses.length">
                  <td colspan="7" class="text-center text-grey-7">Nenhuma resposta encontrada.</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { format, sub } from 'date-fns'
import { RelatorioPesquisaSatisfacao } from 'src/service/estatisticas'
import { ListarUsuarios } from 'src/service/user'
import { ListarFilas } from 'src/service/filas'

export default {
  name: 'RelatorioPesquisaSatisfacao',
  data () {
    return {
      userProfile: 'user',
      users: [],
      queues: [],
      filters: {
        startDate: format(sub(new Date(), { days: 30 }), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        userId: null,
        queueId: null
      },
      report: {
        summary: {
          averageRating: 0,
          totalResponses: 0
        },
        distribution: [],
        averagesByUser: [],
        responses: []
      }
    }
  },
  computed: {
    averageRating () {
      return this.formatNumber(this.report.summary.averageRating)
    },
    totalResponses () {
      return this.report.summary.totalResponses || 0
    },
    distributionMap () {
      return this.report.distribution.reduce((acc, item) => {
        acc[item.rating] = item.total
        return acc
      }, {})
    }
  },
  methods: {
    formatDate (value) {
      if (!value) {
        return 'Não informado'
      }

      return this.$formatDateTime(value)
    },
    formatNumber (value) {
      return Number(value || 0).toFixed(2)
    },
    async loadAuxiliaryData () {
      const [{ data: usersData }, { data: queuesData }] = await Promise.all([
        ListarUsuarios(),
        ListarFilas()
      ])

      this.users = usersData.users || []
      this.queues = queuesData || []
    },
    async loadReport () {
      const { data } = await RelatorioPesquisaSatisfacao(this.filters)
      this.report = {
        summary: data.summary || { averageRating: 0, totalResponses: 0 },
        distribution: data.distribution || [],
        averagesByUser: data.averagesByUser || [],
        responses: data.responses || []
      }
    },
    async clearFilters () {
      this.filters = {
        startDate: format(sub(new Date(), { days: 30 }), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        userId: null,
        queueId: null
      }

      await this.loadReport()
    }
  },
  async mounted () {
    this.userProfile = localStorage.getItem('profile')
    await this.loadAuxiliaryData()
    await this.loadReport()
  }
}
</script>

<style scoped>
.metric-card {
  min-height: 132px;
}

.distribution {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-weight: 600;
}
</style>
