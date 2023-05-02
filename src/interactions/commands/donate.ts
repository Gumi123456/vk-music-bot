import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { getConfig } from '../../db.js'
import { CommandCustomInteraction } from '../commandInteractions.js'

export const interaction: CommandCustomInteraction = {
  name: 'donate',
  aliases: ['premium', 'd'],
  adminOnly: true,
  premium: false,
  djOnly: false,
  execute: async ({ guild, respond }) => {
    const config = await getConfig(guild.id)

    const { premium } = config

    let info = `${premium ? '**Спасибо за поддержку бота!**\n' : ''}`

    if (!premium)
      info += `Вы можете приобрести **Премиум**, задонатив 45₽ или больше [здесь](https://vk.com/app6887721_-197274096)
**В комментарий к переводу укажите данный ID**: \`${guild.id}\`
Премиум дает Вам следующие возможности:
● Режим 24/7 
● Ограничение очереди в 20к, а не в 200 
● Перемешивание очереди
● Бас буст 
● Автоматический пропуск капчи
Все деньги идут на развитие и поддержание бота. Вы можете пользоваться всеми остальными функциями бота абсолютно бесплатно.`
    else info += 'Если вы хотите задонатить на развитие бота, нажмите [сюда](https://vk.com/app6887721_-197274096)'

    const embed = {
      color: 0x5181b8,
      title: `Статус **Премиума**:  ${premium ? '<:yes2:835498559805063169>' : '<:no2:835498572916195368>'}`,
      description: info
    }

    if (!premium) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Приобрести Премиум')
          .setStyle(ButtonStyle.Link)
          .setURL('https://vk.com/app6887721_-197274096')
      )

      await respond({ embeds: [embed], components: [row] })
      return
    }

    await respond({ embeds: [embed] })
  }
}