const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        await interaction.deferReply(); // Defer the reply as we might process lots of data

        try {
            // Filter pets that are marked as secret (assuming there's a "Secret" property)
            const secretPets = Object.entries(Pets)
                .filter(([name, pet]) => pet.Rarity === interaction.options.getString('rarity'))
                .sort((a, b) => a[0].localeCompare(b[0])); // Sort alphabetically

            if (secretPets.length === 0) {
                return await interaction.editReply({
                    content: "❌ No pets have this rarity in the database.",
                    ephemeral: true
                });
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`🔍 ${interaction.options.getString('rarity')} Pets List`)
                .setDescription(`There are ${secretPets.length} ${interaction.options.getString('rarity')} pets in the game.`);

            // Add fields (grouped to avoid hitting embed limits)
            const chunks = [];
            let currentChunk = [];

            secretPets.forEach(([name, pet]) => {
                let info = `• **${name}**`;
                if (pet.Rarity) info += ` (${pet.Rarity})`;
                if (pet.Egg) info += ` - From: ${pet.Egg}`;
                if (pet.Chance) info += ` - Chance: ${(pet.Chance)}%`;

                currentChunk.push(info);

                if (currentChunk.length >= 10) {
                    chunks.push(currentChunk.join('\n'));
                    currentChunk = [];
                }
            });

            // Add any remaining pets
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join('\n'));
            }

            // Add fields to embed (max 5 fields)
            chunks.slice(0, 5).forEach((chunk, index) => {
                embed.addFields({
                    name: index === 0 ? `${interaction.options.getString('rarity')} Pets` : '\u200b',
                    value: chunk,
                    inline: false
                });
            });

            // If there are more chunks than we can display, add a note
            if (chunks.length > 5) {
                embed.addFields({
                    name: 'Note',
                    value: `Showing ${5 * 10} of ${secretPets.length} ${interaction.options.getString('rarity')} pets.`,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in getall command:', error);
            await interaction.editReply({
                content: "❌ An error occurred while fetching pets.",
                ephemeral: true
            });
        }
    }
};