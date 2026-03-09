<template>
  <div v-if="userProfile === 'admin'">
    <q-list class="text-weight-medium">
      <q-item-label
        header
        class="text-bold text-h6 q-mb-lg"
      >Configurações</q-item-label>

      <q-item-label
        caption
        class="q-mt-lg q-pl-sm"
      >Módulo: Atendimento</q-item-label>
      <q-separator spaced />

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Não visualizar Tickets já atribuidos à outros usuários</q-item-label>
          <q-item-label caption>Somente o usuário responsável pelo ticket e/ou os administradores visualizarão a atendimento.</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="NotViewAssignedTickets"
            false-value="disabled"
            true-value="enabled"
            checked-icon="check"
            keep-color
            :color="NotViewAssignedTickets === 'enabled' ? 'green' : 'negative'"
            size="md"
            unchecked-icon="clear"
            @input="atualizarConfiguracao('NotViewAssignedTickets')"
          />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Não visualizar Tickets no ChatBot</q-item-label>
          <q-item-label caption>Somente administradores poderão visualizar tickets que estivem interagindo com o ChatBot.</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="NotViewTicketsChatBot"
            false-value="disabled"
            true-value="enabled"
            checked-icon="check"
            keep-color
            :color="NotViewTicketsChatBot === 'enabled' ? 'green' : 'negative'"
            size="md"
            unchecked-icon="clear"
            @input="atualizarConfiguracao('NotViewTicketsChatBot')"
          />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Forçar atendimento via Carteira</q-item-label>
          <q-item-label caption>Caso o contato tenha carteira vínculada, o sistema irá direcionar o atendimento somente para os donos da carteira de clientes.</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="DirectTicketsToWallets"
            false-value="disabled"
            true-value="enabled"
            checked-icon="check"
            keep-color
            :color="DirectTicketsToWallets === 'enabled' ? 'green' : 'negative'"
            size="md"
            unchecked-icon="clear"
            @input="atualizarConfiguracao('DirectTicketsToWallets')"
          />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Fluxo ativo para o Bot de atendimento</q-item-label>
          <q-item-label caption>Fluxo a ser utilizado pelo Bot para os novos atendimentos</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-select
            style="width: 300px"
            outlined
            dense
            rounded
            v-model="botTicketActive"
            :options="listaChatFlow"
            map-options
            emit-value
            option-value="id"
            option-label="name"
            @input="atualizarConfiguracao('botTicketActive')"
          />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Ignorar Mensagens de Grupo</q-item-label>
          <q-item-label caption>Habilitando esta opção o sistema não abrirá ticket para grupos</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="ignoreGroupMsg"
            false-value="disabled"
            true-value="enabled"
            checked-icon="check"
            keep-color
            :color="ignoreGroupMsg === 'enabled' ? 'green' : 'negative'"
            size="md"
            unchecked-icon="clear"
            @input="atualizarConfiguracao('ignoreGroupMsg')"
          />
        </q-item-section>
      </q-item>

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Recusar chamadas no Whatsapp</q-item-label>
          <q-item-label caption>Quando ativo, as ligações de aúdio e vídeo serão recusadas, automaticamente.</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="rejectCalls"
            false-value="disabled"
            true-value="enabled"
            checked-icon="check"
            keep-color
            :color="rejectCalls === 'enabled' ? 'green' : 'negative'"
            size="md"
            unchecked-icon="clear"
            @input="atualizarConfiguracao('rejectCalls')"
          />
        </q-item-section>
      </q-item>

      <div
        class="row q-px-md"
        v-if="rejectCalls === 'enabled'"
      >
        <div class="col-12">
          <q-input
            rounded
            v-model="callRejectMessage"
            type="textarea"
            autogrow
            dense
            outlined
            label="Mensagem ao rejeitar ligação:"
            input-style="min-height: 6vh; max-height: 9vh;"
            debounce="700"
            @input="atualizarConfiguracao('callRejectMessage')"
          />
        </div>
      </div>

      <div class="row q-px-md">
        <q-item tag="label" class="col-8" v-ripple>
          <q-item-section>
            <q-item-label>Transcrição de audio - Token OpenAi</q-item-label>
          </q-item-section>
        </q-item>

        <div class="col-4">
          <q-input
            class="blur-effect"
            v-model="openAiKey"
            type="textarea"
            autogrow
            dense
            outlined
            label="Token OpenAi"
            input-style="min-height: 6vh;"
            debounce="700"
            @input="atualizarConfiguracao('openAiKey')"
          />
        </div>
      </div>

      <q-item-label
        caption
        class="q-mt-xl q-pl-sm"
      >Módulo: Pesquisa de Satisfação</q-item-label>
      <q-separator spaced />

      <q-item
        tag="label"
        v-ripple
      >
        <q-item-section>
          <q-item-label>Ativar pesquisa de satisfação</q-item-label>
          <q-item-label caption>Quando habilitado, o sistema poderá enviar automaticamente a pesquisa após o encerramento do ticket.</q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
            v-model="satisfactionSurveyEnabled"
            false-value="disabled"
            true-value="enabled"
            checked-icon="check"
            keep-color
            :color="satisfactionSurveyEnabled === 'enabled' ? 'green' : 'negative'"
            size="md"
            unchecked-icon="clear"
            @input="atualizarConfiguracao('satisfactionSurveyEnabled')"
          />
        </q-item-section>
      </q-item>

      <div
        v-if="satisfactionSurveyEnabled === 'enabled'"
        class="row q-col-gutter-md q-px-md q-pb-md"
      >
        <div class="col-xs-12 col-md-4">
          <q-input
            v-model.number="satisfactionSurveyDelayMinutes"
            type="number"
            min="0"
            dense
            outlined
            rounded
            label="Tempo para envio (minutos)"
            @input="atualizarConfiguracao('satisfactionSurveyDelayMinutes')"
          />
        </div>

        <div class="col-xs-12 col-md-4">
          <q-select
            v-model="satisfactionSurveySendScope"
            dense
            outlined
            rounded
            emit-value
            map-options
            :options="satisfactionSurveyScopeOptions"
            label="Abrangência do envio"
            @input="atualizarConfiguracao('satisfactionSurveySendScope')"
          />
        </div>

        <div
          v-if="satisfactionSurveySendScope === 'selected'"
          class="col-xs-12 col-md-4"
        >
          <q-select
            v-model="satisfactionSurveyQueueIds"
            :options="queues"
            option-value="id"
            option-label="queue"
            emit-value
            map-options
            multiple
            use-chips
            dense
            outlined
            rounded
            label="Filas permitidas"
            @input="atualizarConfiguracao('satisfactionSurveyQueueIds')"
          />
        </div>

        <div class="col-12">
          <q-input
            v-model="satisfactionSurveyMessage"
            type="textarea"
            autogrow
            dense
            outlined
            label="Mensagem da pesquisa"
            input-style="min-height: 12vh;"
            debounce="700"
            @input="atualizarConfiguracao('satisfactionSurveyMessage')"
          />
        </div>

        <div class="col-12">
          <q-item
            tag="label"
            v-ripple
            class="q-px-none"
          >
            <q-item-section>
              <q-item-label>Mensagem complementar para notas baixas</q-item-label>
              <q-item-label caption>Quando o cliente responder 1 ou 2, o sistema poderá solicitar mais detalhes.</q-item-label>
            </q-item-section>
            <q-item-section avatar>
              <q-toggle
                v-model="satisfactionSurveyLowRatingFollowupEnabled"
                false-value="disabled"
                true-value="enabled"
                checked-icon="check"
                keep-color
                :color="satisfactionSurveyLowRatingFollowupEnabled === 'enabled' ? 'green' : 'negative'"
                size="md"
                unchecked-icon="clear"
                @input="atualizarConfiguracao('satisfactionSurveyLowRatingFollowupEnabled')"
              />
            </q-item-section>
          </q-item>
        </div>

        <div
          v-if="satisfactionSurveyLowRatingFollowupEnabled === 'enabled'"
          class="col-12"
        >
          <q-input
            v-model="satisfactionSurveyLowRatingFollowupMessage"
            type="textarea"
            autogrow
            dense
            outlined
            label="Mensagem complementar para notas 1 e 2"
            input-style="min-height: 8vh;"
            debounce="700"
            @input="atualizarConfiguracao('satisfactionSurveyLowRatingFollowupMessage')"
          />
        </div>
      </div>

    </q-list>
  </div>
</template>
<script>
import { ListarChatFlow } from 'src/service/chatFlow'
import { ListarFilas } from 'src/service/filas'
import { ListarConfiguracoes, AlterarConfiguracao } from 'src/service/configuracoes'

const defaultSatisfactionSurveyMessage = `Olá! Seu atendimento foi finalizado.

Gostaríamos de avaliar sua experiência.
Por favor, responda com uma nota de 1 a 5:

1 - Muito ruim
2 - Ruim
3 - Regular
4 - Bom
5 - Excelente

Sua opinião é muito importante para nós.`

const defaultLowRatingFollowupMessage = `Sentimos muito pela sua experiência.
Se desejar, nos conte o que aconteceu para que possamos melhorar.`

export default {
  name: 'IndexConfiguracoes',
  data () {
    return {
      userProfile: 'user',
      configuracoes: [],
      listaChatFlow: [],
      queues: [],
      NotViewAssignedTickets: null,
      NotViewTicketsChatBot: null,
      DirectTicketsToWallets: null,
      botTicketActive: null,
      ignoreGroupMsg: null,
      rejectCalls: null,
      callRejectMessage: '',
      hubToken: '',
      openAiKey: '',
      ConnectionHubToken: '',
      satisfactionSurveyEnabled: 'disabled',
      satisfactionSurveyDelayMinutes: 0,
      satisfactionSurveyMessage: defaultSatisfactionSurveyMessage,
      satisfactionSurveySendScope: 'all',
      satisfactionSurveyQueueIds: [],
      satisfactionSurveyLowRatingFollowupEnabled: 'disabled',
      satisfactionSurveyLowRatingFollowupMessage: defaultLowRatingFollowupMessage,
      satisfactionSurveyScopeOptions: [
        { label: 'Todos os atendimentos', value: 'all' },
        { label: 'Apenas filas selecionadas', value: 'selected' }
      ]
    }
  },
  methods: {
    async listarConfiguracoes () {
      const { data } = await ListarConfiguracoes()
      this.configuracoes = data
      this.configuracoes.forEach(el => {
        let value = el.value
        if (el.key === 'botTicketActive' && el.value) {
          value = +el.value
        }
        if (el.key === 'satisfactionSurveyDelayMinutes' && el.value !== null) {
          value = Number(el.value)
        }
        if (el.key === 'satisfactionSurveyQueueIds') {
          try {
            value = el.value ? JSON.parse(el.value) : []
          } catch (error) {
            value = []
          }
        }
        this.$data[el.key] = value
      })
    },
    async listarChatFlow () {
      const { data } = await ListarChatFlow()
      this.listaChatFlow = data.chatFlow
    },
    async listarFilas () {
      const { data } = await ListarFilas()
      this.queues = data
    },
    async atualizarConfiguracao (key) {
      const params = {
        key,
        value: key === 'satisfactionSurveyQueueIds'
          ? JSON.stringify(this.$data[key] || [])
          : String(this.$data[key] !== undefined && this.$data[key] !== null ? this.$data[key] : '')
      }
      try {
        await AlterarConfiguracao(params)
        this.$q.notify({
          type: 'positive',
          message: 'Configuração alterada!',
          progress: true,
          actions: [{
            icon: 'close',
            round: true,
            color: 'white'
          }]
        })
      } catch (error) {
        console.error('error - AlterarConfiguracao', error)
        if (['enabled', 'disabled'].includes(this.$data[key])) {
          this.$data[key] = this.$data[key] === 'enabled' ? 'disabled' : 'enabled'
        }
        this.$notificarErro('Ocorreu um erro!', error)
      }
    }
  },
  async mounted () {
    this.userProfile = localStorage.getItem('profile')
    await this.listarConfiguracoes()
    await this.listarChatFlow()
    await this.listarFilas()
  }
}
</script>

<style lang="scss" scoped>
</style>
