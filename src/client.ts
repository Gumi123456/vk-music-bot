import { Client, ClientOptions, Collection, Events, Message } from 'discord.js'
import Utils, { ErrorMessageType } from './utils.js'
import logger from './logger.js'
import { connectDb, getConfig } from './db.js'
import PlayerManager from './modules/queue.js'
import ShoukakuManager from './modules/shoukakuManager.js'
import { CommandInteractionManager } from './interactions/commandInteractions.js'
import { ButtonInteractionManager } from './interactions/buttonInteractions.js'
import { SelectMenuInteractionManager } from './interactions/selectMenuInteractions.js'
import { ModalInteractionManager } from './interactions/modalInteractions.js'
import { IPCManager } from './events/ipcManager.js'

export interface CaptchaInfo {
  type: 'play' | 'search'
  query: string
  count?: number | null
  offset?: number | null
  url: string
  sid: string
  index: number
  captcha_key?: string
}

export interface PlayerTrackErrorTracker {
  count: number
  timer: NodeJS.Timeout
}

export class VkMusicBotClient extends Client {
  private exiting = false

  public captcha = new Collection<string, CaptchaInfo>()
  public timers = new Collection<string, NodeJS.Timeout>()
  public latestMenus = new Collection<string, Message>()
  public playerTrackErrorTrackers: Collection<string, PlayerTrackErrorTracker> = new Collection()

  public playerManager: PlayerManager
  public shoukaku: ShoukakuManager

  public commandInteractionManager: CommandInteractionManager
  public buttonInteractionManager: ButtonInteractionManager
  public selectMenuInteractionManager: SelectMenuInteractionManager
  public modalInteractionManager: ModalInteractionManager
  public ipcManager: IPCManager

  constructor(options: ClientOptions) {
    if (!process.env.MONGO_URL || !process.env.REDIS_URL) throw new Error('Env not set')
    super(options)

    this.playerManager = new PlayerManager(this)
    this.shoukaku = new ShoukakuManager(this)
    this.commandInteractionManager = new CommandInteractionManager(this)
    this.buttonInteractionManager = new ButtonInteractionManager(this)
    this.selectMenuInteractionManager = new SelectMenuInteractionManager(this)
    this.modalInteractionManager = new ModalInteractionManager(this)
    this.ipcManager = new IPCManager(this)

    this.once(Events.ClientReady, async () => {
      //this.manager.init(this.user?.id)
      //await this.initDb()
      // const slashCommandManager = new SlashCommandManager(this)
      // await slashCommandManager.init()
      logger.info(`Logged in as ${this.user?.tag} successfully`)

      await Promise.all([
        this.commandInteractionManager.load(),
        this.buttonInteractionManager.load(),
        this.selectMenuInteractionManager.load(),
        this.modalInteractionManager.load()
      ])

      logger.info(`Loaded ${this.commandInteractionManager.interactions.size} commands.`)
      logger.info(`Loaded ${this.buttonInteractionManager.interactions.size} button interactions.`)
    })
      // .on('guildDelete', (guild) => {
      //   logger.info({ guild_id: guild.id }, 'Bot leaves')
      //   this.queue.get(guild.id)?.destroy()

      //   Utils.clearExitTimeout(guild.id, this)
      // })
      // .on('messageDelete', (message) => {
      //   logger.debug({ message }, 'delete')
      //   if (!message.inGuild()) return

      //   const menuMessage = this.latestMenus.get(message.guildId)
      //   if (!menuMessage) return

      //   if (message.id === menuMessage.id) {
      //     this.latestMenus.delete(message.guildId)
      //     logger.info({ guild: message.guildId }, 'Removed latestMenusMessage')
      //   }
      // })

      // .on('raw', (data) => {
      //   // logger.debug({ data }, 'raw2')

      //   if (!data?.d?.guild_id || data.op !== 0 || data?.t !== 'MESSAGE_DELETE') return
      //   logger.debug({ data }, 'raw')

      //   const menuMessage = this.latestMenus.get(data.d.guild_id)
      //   if (!menuMessage) return

      //   if (data?.d?.id === menuMessage.id) {
      //     this.latestMenus.delete(data.d.guild_id)
      //     logger.debug({ guildId: data.d.guild_id }, 'Removed latestMenusMessage')
      //   }
      // })

      .on(Events.MessageDelete, (message) => {
        logger.debug({ message })

        if (message.id && message.guildId) {
          const menuMessage = this.latestMenus.get(message.guildId)
          if (!menuMessage) return

          if (message.id === menuMessage.id) {
            this.latestMenus.delete(message.guildId)
            logger.debug({ guildId: message.guildId }, 'Removed latestMenusMessage')
          }
        }
      })

      // TODO: fix this shit
      .on(Events.VoiceStateUpdate, async (oldState, newState) => {
        logger.debug({
          newState: newState,
          oldState: oldState
        })

        let channelIsEmpty = false
        let voiceChannel = null

        if (oldState.id === this.user?.id) {
          const newChannelId = newState.channelId
          const oldChannelId = oldState.channelId
          const guildId = newState.guild.id

          const player = this.playerManager.get(guildId)
          if (!player) return

          const config = await getConfig(guildId)

          let state: 'UNKNOWN' | 'LEFT' | 'JOINED' | 'MOVED' = 'UNKNOWN'
          if (!oldChannelId && newChannelId) state = 'JOINED'
          else if (oldChannelId && !newChannelId) state = 'LEFT'
          else if (oldChannelId && newChannelId && oldChannelId !== newChannelId) state = 'MOVED'

          if (state === 'UNKNOWN') return

          if (state === 'LEFT') {
            logger.debug({ guildId }, 'Player left')
            await player.safeDestroy()
            return
          }

          if (state === 'MOVED' && !config.enable247) {
            logger.debug({ guildId }, 'Player moved')
            voiceChannel = newState.channel
            const members = voiceChannel?.members.filter((m) => !m.user.bot)

            channelIsEmpty = members?.size === 0
          }
        } else {
          voiceChannel = oldState.channel || newState.channel
          if (!voiceChannel) return

          if (this?.user && !voiceChannel.members.has(this.user.id)) return

          const members = voiceChannel.members.filter((m) => !m.user.bot)

          channelIsEmpty = members.size === 0
        }

        if (channelIsEmpty && voiceChannel && !(await getConfig(voiceChannel.guildId)).enable247) {
          const player = this.playerManager.get(voiceChannel.guildId)
          if (!player) return

          const textId = player.textChannelId

          await player.safeDestroy()

          const channel = this.channels.cache.get(textId)
          if (!channel?.isTextBased()) return

          await Utils.sendMessageToChannel(
            channel,
            {
              embeds: [
                Utils.generateErrorMessage(
                  'Бот вышел из канала, так как тут никого нет. ' +
                    'Включите режим 24/7 (</247:906533610918666250>), если не хотите, чтобы это происходило.',
                  ErrorMessageType.Info
                )
              ]
            },
            30_000
          )

          logger.debug({ guildId: voiceChannel.guildId }, 'Player leaved empty channel')
        }
      })
  }

  async login(token?: string | undefined) {
    await super.login(token)

    await connectDb()
    logger.info('DB connected.')

    await this.ipcManager.load()

    return this.constructor.name
  }

  async exit() {
    //
  }
}
