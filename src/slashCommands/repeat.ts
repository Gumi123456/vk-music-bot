import { Command } from '../SlashCommandManager.js'
import Utils, { ErrorMessageType } from '../Utils.js'

export default new Command({
  name: 'repeat',
  aliases: ['l', 'rp', 'loop'],
  djOnly: true,
  adminOnly: false,
  premium: false,
  execute: async function ({ guild, voice, client, interaction, respond }) {
    const player = client.manager.get(guild.id)
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
        player.setQueueRepeat(true)
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор очереди.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'трек') {
        player.setTrackRepeat(true)
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Включен повтор трека.', ErrorMessageType.NoTitle)]
        })
        return
      }
      if (repeatParam === 'выкл') {
        player.setQueueRepeat(false)
        player.setTrackRepeat(false)
        await respond({
          embeds: [Utils.generateErrorMessage('🔁 Повтор выключен.', ErrorMessageType.NoTitle)]
        })
        return
      }
    }

    let msg
    if (player.trackRepeat) msg = 'Повтор текущего трека'
    else if (player.queueRepeat) msg = 'Повтор очереди'

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
