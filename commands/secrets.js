const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Pets = require("../pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getall')
        .setDescription('Get a list of all pets with a specific rarity.')
        .addStringOption(option =>
            option.setName('rarity')
                .setDescription("The rarity of the pets")
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const rarity = interaction.options.getString('rarity');
            const secretPets = Object.entries(Pets)
                .filter(([name, pet]) => pet.Rarity === rarity)
                .sort((a, b) => a[0].localeCompare(b[0]));

            if (secretPets.length === 0) {
                return await interaction.editReply({
                    content: "❌ No pets have this rarity in the database.",
                    ephemeral: true
                });
            }

            // Pagination variables
            const itemsPerPage = 10;
            let currentPage = 0;
            const totalPages = Math.ceil(secretPets.length / itemsPerPage);

            // Function to create embed for current page
            const createEmbed = () => {
                const startIdx = currentPage * itemsPerPage;
                const endIdx = Math.min(startIdx + itemsPerPage, secretPets.length);
                const currentPets = secretPets.slice(startIdx, endIdx);

                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`🔍 ${rarity} Pets List`)
                    .setDescription(`There are ${secretPets.length} ${rarity} pets in the game.`)
                    .addFields({
                        name: `${rarity} Pets (Page ${currentPage + 1}/${totalPages})`,
                        value: currentPets.map(([name, pet]) => {
                            let info = `• **${name}**`;
                            if (pet.Rarity) info += ` (${pet.Rarity})`;
                            if (pet.Egg) info += ` - From: ${pet.Egg}`;
                            if (pet.Chance) info += ` - Chance: ${pet.Chance}%`;
                            return info;
                        }).join('\n'),
                        inline: false
                    })
                    .setFooter({ text: `Page ${currentPage + 1} of ${totalPages}` });

                return embed;
            };

            // Create buttons
            const createButtons = () => {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === totalPages - 1)
                    );

                return row;
            };

            // Send initial reply with buttons
            const reply = await interaction.editReply({
                embeds: [createEmbed()],
                components: [createButtons()]
            });

            // Create collector for button interactions
            const collector = reply.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: "❌ These buttons aren't for you!", ephemeral: true });
                }

                if (i.customId === 'previous' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next' && currentPage < totalPages - 1) {
                    currentPage++;
                }

                await i.update({
                    embeds: [createEmbed()],
                    components: [createButtons()]
                });
            });

            collector.on('end', () => {
                interaction.editReply({
                    components: []
                }).catch(console.error);
            });

        } catch (error) {
            console.error('Error in getall command:', error);
            await interaction.editReply({
                content: "❌ An error occurred while fetching pets.",
                ephemeral: true
            });
        }
    }
};