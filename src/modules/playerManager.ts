import { Guild, VoiceBasedChannel } from 'discord.js'
import { Node, Player } from 'shoukaku'
import { VkMusicBotClient } from '../client.js'
import logger from '../logger.js'
import BotTrack from '../structures/botTrack.js'
import BotPlayer from './botPlayer.js'

export default class PlayerManager extends Map<string, BotPlayer> {
  public client: VkMusicBotClient

  constructor(client: VkMusicBotClient) {
    super()
    this.client = client
  }

  async handle(guild: Guild, voiceChannelId: string, textChannelId: string, node: Node, tracks: BotTrack[]) {
    const existing = this.get(guild.id)
    if (!existing) {
      if (this.client.shoukaku.players.has(guild.id)) return 'Busy'
      let player: Player | null = null

      const channel = guild.client.channels.cache.get(voiceChannelId) as VoiceBasedChannel | undefined

      const playerOptions = {
        guildId: guild.id,
        shardId: guild.shardId,
        channelId: voiceChannelId,
        deaf: true
      }

      try {
        player = await node.joinChannel(playerOptions)
      } catch (err) {
        const loggerInfo = {
          guildId: guild.id,
          shardId: guild.shardId,
          nodeName: node.name,
          region: channel?.rtcRegion ?? 'auto',
          err
        }

        logger.error(loggerInfo, "Can't connect to voice channel")

        try {
          player = await node.joinChannel(playerOptions)
        } catch (err) {
          logger.error(loggerInfo, "Can't connect to voice channel a second time(((")
          throw err
        }
      }

      logger.debug(`New connection @ guild "${guild.id}"`)
      const dispatcher = new BotPlayer(this.client, guild.id, textChannelId, player)
      dispatcher.queue.push(...tracks)
      this.set(guild.id, dispatcher)
      logger.debug(`New player dispatcher @ guild "${guild.id}"`)
      return dispatcher
    }
    existing.queue.push(...tracks)
    if (!existing.current) await existing.play()
    return null
  }
}