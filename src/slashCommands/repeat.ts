import CustomPlayer from '../kagazumo/CustomPlayer.js'
import { Command } from '../slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'repeat',
  aliases: ['l', 'rp', 'loop'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.kagazumo.getPlayer<CustomPlayer>(guild.id)
    if (!player) {
      await respond({
        embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
        ephemeral: true
      })
      return
    }

    if (!voice) {
      await respond({
        embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
        ephemeral: true
      })
      return
    }

    const repeatParam = interaction.options.getString('режим')

    if (repeatParam) {
      if (repeatParam === 'очередь') {
        player.setLoop('queue')
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор очереди.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'трек') {
        player.setLoop('track')
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор трека.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'выкл') {
        player.setLoop('none')
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Повтор выключен.', ErrorMessageType.NoTitle)]
        })
        return
      }
    }

    let msg
    if (player.loop === 'track') msg = 'Повтор текущего трека'
    if (player.loop === 'queue') msg = 'Повтор очереди'

    if (msg)
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            `🔁 ${msg} сейчас включен. Доступные режимы: \`очередь\`, \`трек\`, \`выкл\``,
            ErrorMessageType.NoTitle
          )
        ]
      })
    else
      await respond({
        embeds: [
          Utils.generateErrorMessage(
            '🔁 Повтор сейчас выключен. Доступные режимы: `очередь`, `трек`, `выкл`',
            ErrorMessageType.NoTitle
          )
        ]
      })
  }
})
