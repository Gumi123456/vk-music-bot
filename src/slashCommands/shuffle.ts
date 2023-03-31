import { Command } from '../modules/slashCommandManager.js'
import Utils, { ErrorMessageType } from '../utils.js'

export default new Command({
  name: 'shuffle',
  aliases: ['sh'],
  djOnly: true,
  premium: true,
  adminOnly: false,
  cooldown: 3,
  execute: async function ({ guild, voice, client, respond }) {
    const player = client.queue.get(guild.id)
    if (!player) {
      await Utils.sendNoPlayerMessage(respond)
      return
    }

    if (!voice) {
      await Utils.sendNoVoiceChannelMessage(respond)
      return
    }

    if (player.queue.length === 0) {
      await Utils.sendNoQueueMessage(respond)
      return
    }

    player.shuffle()

    await respond({
      embeds: [Utils.generateErrorMessage('🔀 Очередь перемешана.', ErrorMessageType.NoTitle)]
    })
  }
})
