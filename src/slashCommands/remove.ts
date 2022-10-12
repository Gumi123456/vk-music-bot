import { Command } from '../SlashCommandManager'
import { Track, UnresolvedTrack } from 'erela.js-vk'
import Utils, { ErrorMessageType } from '../Utils'

export default new Command({
  name: 'remove',
  aliases: ['r'],
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
        embeds: [
          Utils.generateErrorMessage(
            'Необходимо находиться в голосовом канале.'
          )
        ],
        ephemeral: true
      })
      return
    }

    const queue = player.queue

    let removedTracks: (Track | UnresolvedTrack)[] = []

    const a = interaction.options.getString('треки') as string

    if (a.includes('-')) {
      const first = parseInt(a.split('-')[0])
      const last = parseInt(a.split('-')[1])
      if (last && first && last > first)
        removedTracks = [...removedTracks, ...queue.remove(first - 1, last)]
    } else {
      const inta = parseInt(a)
      if (inta >= 1)
        removedTracks = [...removedTracks, ...queue.remove(inta - 1)]
    }

    await respond({
      embeds: [
        Utils.generateErrorMessage(
          `🗑️ Удалено треков: ${removedTracks.length}.`,
          ErrorMessageType.NoTitle
        )
      ]
    })
  }
})
