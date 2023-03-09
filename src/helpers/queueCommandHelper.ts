import {
  InteractionReplyOptions,
  InteractionUpdateOptions,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle
} from 'discord.js'
import Utils from '../utils.js'
import CustomPlayer from '../kazagumo/CustomPlayer.js'

export function generateQueueResponse(
  page: number,
  player: CustomPlayer | undefined
): InteractionReplyOptions | InteractionUpdateOptions {
  if (!player)
    return {
      embeds: [Utils.generateErrorMessage('Сейчас ничего не играет.')],
      ephemeral: true,
      components: []
    }

  const queue = player.queue
  const embed = new EmbedBuilder().setAuthor({ name: 'Треки в очереди' }).setColor(0x5181b8)

  const multiple = 10
  page = page < 0 ? 1 : page

  const end = page * multiple
  const start = end - multiple

  const tracks = queue.slice(start, end)

  if (queue.current)
    embed.addFields({
      name: 'Сейчас играет',
      value: `${queue.current.author} — ${queue.current.title} (${Utils.formatTime(player.position)}/${Utils.formatTime(
        queue.current.length ?? 0
      )})`
    })
  //console.log(queue.current)

  if (!tracks.length) embed.setDescription(`Нет треков на странице \`${page}\`.`)
  else {
    embed.setDescription(
      tracks
        .map((track, i) => `${start + ++i}. ${Utils.escapeFormat(track.author)} — ${Utils.escapeFormat(track.title)}`)
        .join('\n')
    )
  }

  const maxPages = Math.ceil(queue.length / multiple)

  embed.setFooter({
    text: `Страница ${page > maxPages ? maxPages : page} из ${maxPages}`
  })

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId(`queue_${page - 1}`)
        .setEmoji('<:chevron_left:1073665636741414922>')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page - 1 <= 0),
      new ButtonBuilder()
        .setCustomId(`queue_${page + 1}`)
        .setEmoji('<:chevron_right:1073665639786487818>')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page + 1 > maxPages),
      new ButtonBuilder()
        .setCustomId('deleteMessage')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('<:trash_btn:1073668424531709992>')
    ])
  ]

  return { embeds: [embed], components }
}
