const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Pets = require("../pets.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getegg')
        .setDescription('Get information about all pets in a specific egg')
        .addStringOption(option =>
            option.setName('egg')
                .setDescription('Name of the egg')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        
        // Get all unique eggs from pets
        const allEggs = new Set();
        Object.values(Pets).forEach(pet => {
            if (pet.Egg) {
                allEggs.add(pet.Egg);
            }
        });
        
        const filtered = Array.from(allEggs).filter(egg => 
            egg.toLowerCase().includes(focusedValue))
            .slice(0, 25);
            
        await interaction.respond(
            filtered.map(egg => ({ name: egg, value: egg }))
        );
    },

    async execute(interaction) {
        await interaction.deferReply();

        const eggName = interaction.options.getString('egg');

        try {
            // Filter pets that belong to this egg
            const petsInEgg = Object.entries(Pets)
                .filter(([petName, petData]) => petData.Egg === eggName);
            
            if (petsInEgg.length === 0) {
                throw new Error(`No pets found in egg "${eggName}"`);
            }

            const thumbnailUrl = "https://cdn.discordapp.com/avatars/973159740303638549/034b19c983d71774f1c305876692a5e5.webp?size=320";

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Pets in ${eggName} Egg`)
                .setThumbnail(thumbnailUrl);

            // Add each pet's information
            petsInEgg.forEach(([petName, petData]) => {
                let petInfo = [];
                
                if (petData.Description) {
                    petInfo.push(`*${petData.Description}*`);
                }
                
                if (petData.Chance !== undefined) {
                    petInfo.push(`**Chance:** ${petData.Chance}%`);
                }
                
                // Add stats if they exist
                if (petData.Stats) {
                    const statsText = Object.entries(petData.Stats)
                        .map(([stat, value]) => `**${stat}:** ${value}`)
                        .join(' | ');
                    petInfo.push(statsText);
                }
                
                embed.addFields({
                    name: petName,
                    value: petInfo.join('\n'),
                    inline: false
                });
            });

            // Add total chance information
            const totalChance = petsInEgg.reduce((sum, [_, pet]) => {
                return sum + (pet.Chance || 0);
            }, 0);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};