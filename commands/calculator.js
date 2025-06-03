const { SlashCommandBuilder, EmbedBuilder, ThreadChannel, ContainerComponent } = require('discord.js');
const Pets = require("../pets.json");

function convertSecondsToDHMS(totalSeconds) {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) {
        throw new Error("Input must be a non-negative number.");
    }

    const days = Math.floor(totalSeconds / (24 * 3600));
    totalSeconds %= (24 * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.ceil(totalSeconds % 60);

    return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateEggs(totalSeconds, speed, amount) {
    return (totalSeconds / (4.5 / (speed / 100))) * amount;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculate')
        .setDescription('Calculate many different things')
        .addSubcommandGroup(group =>
            group.setName('time')
                .setDescription('Time-related calculations')
                // Pet calculation subcommand
                .addSubcommand(subcommand =>
                    subcommand.setName('pet')
                        .setDescription('Calculate the luck & time needed to hatch a pet')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Name of the pet')
                                .setRequired(true)
                                .setAutocomplete(true))
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription('Amount of eggs you can hatch at once')
                                .setRequired(true))
                        .addNumberOption(option =>
                            option.setName('speed')
                                .setDescription('Your hatch speed in percentage (view in Debug)')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('luck')
                                .setDescription('Your luck percentage (view in Debug)')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('mythicluck')
                                .setDescription('1 / Your mythic chance (view in Debug)')
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('shiny')
                                .setDescription('Show shiny chances')
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('mythic')
                                .setDescription('Show mythic chances')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('bubble')
                        .setDescription('Calculate how many bubbles you get over time')
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription('Amount of bubbles you get per click')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('selling')
                                .setDescription('How many coins you get per bubble')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('hours')
                                .setDescription('Hours')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('minutes')
                                .setDescription('Minutes')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('seconds')
                                .setDescription('seconds')
                                .setRequired(true)))
                // Egg calculation subcommand
                .addSubcommand(subcommand =>
                    subcommand.setName('eggs')
                        .setDescription('Calculate how many eggs you can hatch within a set amount of time')
                        .addIntegerOption(option =>
                            option.setName('amount')
                                .setDescription('Amount of eggs you can hatch at once')
                                .setRequired(true))
                        .addNumberOption(option =>
                            option.setName('speed')
                                .setDescription('Your hatch speed in percentage (view in Debug)')
                                .setRequired(true))
                        .addIntegerOption(option => 
                            option.setName('hours')
                                .setDescription('Hours')
                                .setRequired(true))
                        .addIntegerOption(option => 
                            option.setName('minutes')
                                .setDescription('Minutes')
                                .setRequired(true))
                        .addIntegerOption(option => 
                            option.setName('seconds')
                                .setDescription('Seconds')
                                .setRequired(true))))
        .addSubcommandGroup(group =>
            group.setName('luck')
                .setDescription('Calculate all sorts of luck related things.')
                .addSubcommand(subcommand => 
                    subcommand.setName('total')
                        .setDescription('Calculate your total luck')
                        .addBooleanOption(option =>
                            option.setName('elixir')
                                .setDescription('Using the infinity elixir')
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('indexluck')
                                .setDescription('Set to true if you have the index luck boost.')
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('doubleluck')
                                .setDescription('Set to true if you have the double luck gamepass.')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('potion')
                                .setDescription('The level of luck potion running, type 0 for no potion. (6 = evo)')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('friends')
                                .setDescription('Amount of friends in your server.')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('highrollers')
                                .setDescription('Amount of pets with High Roller enchant.')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('riftmulti')
                                .setDescription('Put this to the luck multiplier of your egg.')
                                .setRequired(true)))
                .addSubcommand(subcommand => 
                    subcommand.setName('infinity')
                        .setDescription('Calculate your infinity egg')
                        .addStringOption(option => 
                            option.setName('world')
                                .setDescription('The world this pet is from')
                                .setRequired(true)
                                .setChoices(
                                    { name: "The Overworld", value: "overworld" },
                                    { name: "Minigame Paradise", value: "minigame" }
                                ))
                        .addStringOption(option =>
                            option.setName('rarity')
                                .setDescription('The rarity being calculated')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('pet')
                                .setDescription('The pet being calculated')
                                .setRequired(true)))
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        const embed = new EmbedBuilder().setColor(0x0099FF);
        
        if (group === 'time') {
            const Hours = interaction.options.getInteger('hours');
            const Minutes = interaction.options.getInteger('minutes');
            const Seconds = interaction.options.getInteger('seconds');
            
            const TotalTime = Seconds + (Minutes * 60) + (Hours * 3600);

            const Amount = interaction.options.getInteger('amount');
            const Speed = interaction.options.getNumber('speed');

            if (subcommand === "pet") {
                const Pet = Pets[interaction.options.getString('name')];
                if (!Pet) return await interaction.editReply({ content: "❌ Pet not found", ephemeral: true });
        
                let Chance = Pet.Chance;

                const Luck = interaction.options.getInteger('luck');
        
                const SingleHatchTime = (4.5 / (Speed / 100));
                let AmountRequired = Math.ceil((100 / (Chance * (Luck / 100))) / Amount);
                
                if (interaction.options.getBoolean('shiny') === true) AmountRequired /= 0.025;
                if (interaction.options.getBoolean('mythic') === true) AmountRequired /= (1 / interaction.options.getInteger('mythicluck'))
        
                const TotalHatchTime = convertSecondsToDHMS(AmountRequired * (SingleHatchTime / Amount));
        
                embed.setTitle('🍀 Luck Calculation')
                    .setDescription(`Here's all the info about hatching ${interaction.options.getString('name')}.`)
                    .addFields(
                        { name: "Hatch Time", value: `${TotalHatchTime}`, inline: false },
                        { name: "Egg To Hatch", value: `${Pet.Egg}`, inline: false },
                        { name: "Eggs Per Minute", value: `${Math.floor((60 / SingleHatchTime) * Amount)}`, inline: false },
                        { name: "Amount Of Eggs", value: `${AmountRequired}`, inline: false },
                        { name: "Chance (With Luck)", value: `${Chance * (Luck / 100)}%`, inline: false },
                    );
                    
                return interaction.editReply({ embeds: [embed] });
            } 
            else if (subcommand === "eggs") {
                embed.setTitle('⌛ Time Calculation')
                    .setDescription(`Here's all the details you need.`)
                    .addFields(
                        { name: "Eggs Per Minute", value: `${Math.floor(calculateEggs(60, Speed, Amount))}` },
                        { name: "Eggs Per Hour", value: `${Math.floor(calculateEggs(3600, Speed, Amount))}` },
                        { name: "Eggs Per Day", value: `${Math.floor(calculateEggs(86400, Speed, Amount))}` },
                        { name: "Total Eggs", value: `${Math.floor(calculateEggs(TotalTime, Speed, Amount))}` },
                    );
                    
                return interaction.editReply({ embeds: [embed] });
            }
            else if (subcommand === "bubble") {
                const Coins = interaction.options.getInteger('selling');
                embed.setTitle('<:bubblegum:1367185749275054121> Bubbles Calculation')
                    .setDescription(`Here's all the details you need.`)
                    .addFields(
                        { name: "Bubbles Per Minute", value: `${Math.floor((Amount * 2) * 60)}` },
                        { name: "Bubbles Per Hour", value: `${Math.floor((Amount * 2) * 3600)}` },
                        { name: "Bubbles Per Day", value: `${Math.floor((Amount * 2) * 86400)}` },
                        { name: "Coins Per Minute", value: `${Math.floor(((Amount * 2) * Coins) * 60)}` },
                        { name: "Coins Per Hour", value: `${Math.floor(((Amount * 2) * Coins) * 3600)}` },
                        { name: "Coins Per Day", value: `${Math.floor(((Amount * 2) * Coins) * 86400)}` },
                        { name: "Total Bubbles", value: `${Math.floor((Amount * 2) * TotalTime)}` },
                        { name: "Total Coins", value: `${Math.floor(((Amount * 2) * Coins) * TotalTime)}` },

                    )

                return interaction.editReply({ embeds: [embed] })
            }
        } else if (group === "luck") {
            if (subcommand === "total") {
                const Potions = {"0": 0, "1": 10, "2": 20, "3": 30, "4": 65, "5": 150, "6": 600}
                embed.setTitle('🍀 Luck Calculation')
                .setDescription(`Here's a detailed explanation on how your luck is calculated.`)
                .addFields(
                    { name: "Starting Luck", value: `x1 (Default)` },
                );

                let TotalLuck = 1;

                if (interaction.options.getInteger('riftmulti') >= 1) {
                    TotalLuck = interaction.options.getInteger('riftmulti');
                    embed.addFields(
                        { name: "Rift Luck", value: `x${interaction.options.getInteger('riftmulti')} (Now: x${TotalLuck.toFixed(2)})`}
                    );
                };

                if (interaction.options.getBoolean('indexluck') === true) {
                    TotalLuck += 0.5;
                    embed.addFields(
                        { name: "Index Luck", value: `+50% (Now: x${TotalLuck.toFixed(2)})`}
                    );
                };

                const Potion = Potions[interaction.options.getInteger('potion')];
                if (Potion !== 0) {
                    TotalLuck += Potion / 100
                    embed.addFields(
                        { name: "Potion Luck", value: `+${Potion}% (Now: x${TotalLuck.toFixed(2)})`}
                    );
                }

                if (interaction.options.getBoolean('elixir') === true) {
                    TotalLuck *= 2;
                    embed.addFields(
                        { name: "Elixir Luck", value: `x2 (Now: x${TotalLuck.toFixed(2)})`}
                    );
                };

                if (interaction.options.getBoolean('doubleluck') === true) {
                    TotalLuck *= 2;
                    embed.addFields(
                        { name: "Gamepass Luck", value: `x2 (Now: x${TotalLuck.toFixed(2)})`}
                    );
                };
            
                const Friends = interaction.options.getInteger('friends');
                if (Friends !== 0) {
                    TotalLuck += (Friends / 10);
                    embed.addFields(
                        { name: "Friends Luck", value: `+${Friends * 10}% (Now: x${TotalLuck.toFixed(2)})`}
                    );
                };

                const HighRollers = interaction.options.getInteger('highrollers');
                if (HighRollers !== 0) {
                    TotalLuck += (HighRollers / 10);
                    embed.addFields(
                        { name: "High Roller Luck", value: `+${HighRollers * 10}% (Now: x${TotalLuck.toFixed(2)})`}
                    );
                };

                embed.addFields(
                    { name: "Total Luck", value: `x${TotalLuck.toFixed(2)}`}
                );

                return interaction.editReply({ embeds: [embed] });
            }
            else if (subcommand === "infinity") {
                const Infinity = require(`../infinity-${interaction.options.getString('world')}.json`);
                const Rarities = {"Common": 60, "Unique": 20, "Rare": 13, "Epic": 2.5, "Legendary": 0.5, "Secret": 0.0000025};
                const Rarity = interaction.options.getString('rarity');
                const Pet = interaction.options.getString('pet');

                if (Rarities[Rarity]) {
                    if (Infinity[Rarity][Pet]) {
                        let RarityChance = Rarities[Rarity];
                        embed.setTitle('♾️ Infinity Calculation')
                            .setDescription(`Here are the chances for the infinity egg.`)
                            .addFields(
                                { name: `${Rarity} Chance`, value: `${RarityChance}%` },
                                { name: `${Pet} Chance`, value: `${Infinity[Rarity][Pet].toFixed(4)}` },
                            );

                        return interaction.editReply({ embeds: [embed] });
                    } else {
                        return interaction.editReply("Pet doesn't exist, hasn't been updated yet or is not from this rarity.");
                    }
                } else {
                    return interaction.editReply("Invalid Rarity.");
                };
            };
        };

        return interaction.editReply("Invalid command structure.");
    },
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        
        if (focusedOption.name === 'name') {
            const filtered = Object.keys(Pets).filter(pet => 
                pet.toLowerCase().includes(focusedOption.value.toLowerCase())
            );
            await interaction.respond(
                filtered.map(pet => ({ name: pet, value: pet })).slice(0, 25)
            );
        }
    }
};