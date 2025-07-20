const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Pets = require("../pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getpet')
        .setDescription('Get information about a specific pet')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the pet')
                .setRequired(true)
                .setAutocomplete(true))
        .addBooleanOption(option =>
            option.setName('shiny')
                .setDescription('Show shiny variant'))
        .addBooleanOption(option =>
            option.setName('mythical')
                .setDescription('Show mythical variant')),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filtered = Object.keys(Pets).filter(pet => 
            pet.toLowerCase().includes(focusedValue))
            .slice(0, 25);
        await interaction.respond(
            filtered.map(pet => ({ name: pet, value: pet }))
        );
    },

    async execute(interaction) {
        await interaction.deferReply();

        const petName = interaction.options.getString('name');
        const isShiny = interaction.options.getBoolean('shiny') || false;
        const isMythical = interaction.options.getBoolean('mythical') || false;

        try {
            const pet = Pets[petName];
            if (!pet) throw new Error(`Pet "${petName}" not found`);

            const thumbnailUrl = "https://cdn.discordapp.com/avatars/973159740303638549/034b19c983d71774f1c305876692a5e5.webp?size=320";

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${petName} ${isMythical ? '✨' : ''}${isShiny ? '🌟' : ''}`)
                .setThumbnail(thumbnailUrl);

            // Calculate stat multipliers
            let multiplier = 1;
            if (isShiny) multiplier += 1.5;
            if (isMythical) multiplier += 1.75;

            // Add stats with multipliers
            if (pet.Stats) {
                for (const [stat, value] of Object.entries(pet.Stats)) {
                    const multipliedValue = Math.round(value * multiplier * 100) / 100;
                    embed.addFields({ 
                        name: stat, 
                        value: String(multipliedValue), 
                        inline: true 
                    });
                }
            }

            if (pet.Description) {
                embed.setDescription(pet.Description);
            }

            // Calculate combined chance
            const additionalInfo = [];
            if (pet.Egg) {
                additionalInfo.push(`**Egg:** ${pet.Egg}`);
            }

            if (pet.Chance !== undefined) {
                let baseChance = pet.Chance;
                let combinedChance = baseChance;
                let chanceText = `**Base Chance:** ${(baseChance)}%`;

                if (isShiny) {
                    const shinyChance = baseChance * (1/40);
                    combinedChance = shinyChance;
                    chanceText += `\n**Shiny Chance (1/40):** ${(shinyChance)}%`;
                }

                if (isMythical) {
                    const mythicChance = baseChance * (1/100);
                    combinedChance = mythicChance;
                    chanceText += `\n**Mythical Chance (1/100):** ${(mythicChance)}%`;
                }

                if (isShiny && isMythical) {
                    const shinyMythicChance = baseChance * (1/40) * (1/100);
                    combinedChance = shinyMythicChance;
                    chanceText += `\n**Shiny Mythical Chance:** ${(shinyMythicChance)}%`;
                }

                additionalInfo.push(chanceText);
            }

            if (additionalInfo.length > 0) {
                embed.addFields({
                    name: 'Hatching Information',
                    value: additionalInfo.join('\n'),
                    inline: false
                });
            }

            // Footer with variant info
            let variantInfo = [];
            if (isShiny) variantInfo.push("Shiny (1.5x)");
            if (isMythical) variantInfo.push("Mythical (1.75x)");

            if (variantInfo.length > 0) {
                embed.setFooter({ 
                    text: `Variant: ${variantInfo.join(' + ')} | Total multiplier: ${multiplier}x` 
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};