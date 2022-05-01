import { Command } from '../SlashCommandManager'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'leave',
  djOnly: true,
  cooldown: 1,
  adminOnly: false,
  premium: false,
  execute: async ({ client, respond, guild, voice }) => {
    const player = client.manager.get(guild.id)
    if (!player) return respond({ embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')], ephemeral: true })

    if (!voice) return respond({
      embeds: [Utils.generateErrorMessage('Необходимо находиться в голосовом канале.')],
      ephemeral: true
    })
    //if (channel.id !== player.voiceChannel) return message.reply("вы находитесь не в том голосовом канале.")

    const timer = client.timers.get(guild.id)
    if (timer)
      clearTimeout(timer)

    player.destroy()

    respond({ embeds: [Utils.generateErrorMessage('👋', ErrorMessageType.NoTitle)] })
  }
})
