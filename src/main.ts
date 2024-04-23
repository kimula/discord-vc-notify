import { Client, VoiceChannel, GatewayIntentBits, VoiceState } from 'discord.js';
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on('ready', () => {
  console.log(`${client.user?.tag} logged in`);
});

const sendStateChange = (state: VoiceState, leaves: boolean) => {
  try {
    const { guild } = state;

    const voiceChannelId = state.channelId;
    if (voiceChannelId === null)
      throw 'channel id is null';

    const voiceChannel = <VoiceChannel>guild.channels.cache.get(voiceChannelId);
    const userIds = voiceChannel.members.map((_, userId) => userId);

    const member = guild.members.cache.get(state.id);
    if (!member || member.user.bot)
      return;

    const verb = leaves ? 'leaves' : 'joins';
    console.log(`${member.displayName} (${member.id}) ${verb} ${voiceChannel.name} (${voiceChannel.id})`);

    const embed = {
      color: leaves ? 0xFF0000 : 0x00FF00,
      fields: [
        {
          name: 'event',
          value: `<@${state.id}> ${verb}`,
          inline: true,
        },
        {
          name: 'result',
          value: userIds.map(it => `<@${it}>`).join(' ') || 'none',
          inline: true,
        },
      ],
    }

    voiceChannel.send({ embeds: [embed] }).catch(console.error)
  } catch (e) {
    console.error(e);
  }
}

client.on('voiceStateUpdate', async (stateOld, stateNew) => {
  if (stateOld.channelId) {
    if (stateNew.channelId) {
      if (stateOld.channelId != stateNew.channelId) {
        sendStateChange(stateOld, true);
        sendStateChange(stateNew, false);
      }
    }
    else
      sendStateChange(stateOld, true);
  }
  else {
    if (stateNew.channelId)
      sendStateChange(stateNew, false);
    else
      return;
  }
});

if (!process.env.DISCORD_TOKEN)
  throw 'set DISCORD_TOKEN';

client.login(process.env.DISCORD_TOKEN);
