# swgoh-comlink-wrapper-for-gas
Is a Google App Script gs file containing a class that can make interactions with [SWGoH Comlink](https://github.com/swgoh-utils/swgoh-comlink) easier.

### Limitiations
[Google App Script has limitations](https://developers.google.com/apps-script/guides/services/quotas) that the current /localization and /data endpoints exceed. URL Fetch response size has a limit of 50mb which most data segments exceed and localization has to be unzipped and converted into text with .getDataAsString() which has a limit of 100mb which it greatly exceeds. Due to these limitations a few versions of this wrapper have been created.

#### Versions
* **ComlinkAPI** - This is a library file accepts a hosted Comlink url, Comlink for Github or the swgoh.gg api url and will utilize swgoh-utils/damedata repo to provide the data files. You can use the following Script ID to use it in your sheets:\
`1k18re5-xluQEBoB_eF4wKvhJKC6DvLWu4woDtTV_vyDttwed02qAjiWA`.

## Setup
If wanting it directly in your project to utilize the jsdoc you should create a new script file in your Google App Script project and then copy and paste this ComlinkAPI.gs file into it. This file uses the ES6 so you must set your Google App Script project to utilize the V8 runtime, for instructions on how to do that check [developers.google.com](https://developers.google.com/apps-script/guides/v8-runtime#enabling_the_v8_runtime).

Otherwise you can add it as a library by clicking on Libraries and pasting the above Script ID into it and selecting the newest version.

### Initialization
#### Parameters
`host` _String_\
The full url path that the api data resides on. This can be your Heroku App web address or your forked Github repository.

`accessKey` _String_ | **Optional**\
The public key required if HMAC has been enabled for Comlink connections.

`secretKey` _String_ | **Optional**\
The private key required if HMAC has been enabled for Comlink connections.

`language` _String_ | **Optional**\
The language to localize the responses in. Default is "ENG_US".\
Options: CHS_CN, CHT_CN, ENG_US, FRE_FR, GER_DE, IND_ID, ITA_IT, JPN_JP, KOR_KR, POR_BR, RUS_RU, SPA_XM, THA_TH, TUR_TR

```javascript
// Copied file
const api = new Comlink(host, accessKey, secretKey, language);

// Library
const api = new libraryName.Comlink(host, accessKey, secretKey, language);
```

#### Usage Examples
```javascript
//Instantiate Class
const api = new Comlink(host, accessKey, secretKey, language);
//Get player raw profile
const player = api.fetchPlayers([allyCode])[0];
//Get player profile, no enums, and adds additional unit details
const player = api.fetchPlayers[[allyCode],false,true)[0];
//Get a list of guild profiles
const guilds = api.fetchGuilds([guildID,guildID]);
//Get a guild profile, add player profiles to it, and adds additional unit details
const guildRoster = api.fetchGuildRosters([guildID], false, true)[0];
//Get several guild profiles, add player profiles to it, and adds additional unit details
const guildData = api.fetchGuildRosters([guildID], false, true);
```

## Methods
### .fetchPlayers(id, enums, preBuild)
<details><summary>Returns the specified player profile from the api. Includes options for return the data with additional details.</summary>

#### Parameters
`id` _Array_\
List of player's ally codes or player ids to retrieve data for.

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

`preBuild` _Bool_ | **Optional**\
Flag to return response with additional data that is all localized. Default is false.
  
`limit` _Integer_ | **Optional**\
Indicates how many profiles to fetch at once from the api. Default is 10, limit is 100.

```json
```
</details>


### .fetchGuilds(id, enums)
<details><summary>Returns a list of specified guild profiles from the api.</summary>

#### Parameters
`id` _Array_\
List of player ally codes, player ids, or guild ids to retrieve data for. Player Ids require the isPlayerID flag to be true.

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

`isPlayerID` _Bool_ | **Optional**\
Flag to indicate that all of the ids being used are player ids. Default is false.
  
```json
```
</details>


### .fetchGuildRosters(id, enums, preBuild)
<details><summary>Returns a list of specified guild profiles from the api and adds player profiles for each member in the guild.</summary>

#### Parameters
`id` _Array_\
List of player ally codes, player ids, or guild ids.

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

`preBuild` _Bool_ | **Optional**\
Flag to return response with additional data that is all localized. Default is false.

`isPlayerID` _Bool_ | **Optional**\
Flag to indicate that all of the ids being used are player ids. Default is false.
  
```javascript
```
</details>


### .fetchData(collections, enums)
<details><summary>Returns the specified game data collections.</summary>

#### Parameters
`collections` _Array_\
An array of specified collection names, see [SWGOH Comlink Wiki](https://gitlab.com/swgoh-tools/swgoh-comlink/-/wikis/Game-Data) for full list.\
Also accepts the following named groups: 
* "for_gameData" = collections required for building gameData.json
* "for_conquest" - all collections related to Conquest
* "for_abilities" - all collections related to unit abilities
* "for_territoryBattles" - all collectons related to Territory Battles
* "for_playerProfile" - all collections used to expand player data
* "for_datacrons" - all collections related to Datacrons
* "for_grandArena" - all collections related to Grand Arena

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

```json
```
</details>


### .fetchEvents()
Returns the current and upcoming events for the game. Does not include guild events or surprise events.


### .fetchGuildByName(name, count, enums)
<details><summary>Returns a list of guild profiles that contain the specified name in them.</summary>

#### Parameters
`name` _String_\
The name of the guild.

`count` _Integer_ | **Optional**\
The number of results to return.

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

```json
```
</details>


### .fetchGuildByCriteria(options,enums)
<details><summary>Returns a list of guild profiles that match the criteria.</summary>

#### Parameters
`options` _Object_\
Contains the keys and values to search for.
> minMemberCount: 1-50   Default is 1\
> maxMemberCount: 1-50   Default is 50\
> minGUildGalacticPower: 1+   Default is 1\
> maxGuildGalacticPower: 1+   Default is 999999999\
> count: 1-10000   Default is 10000

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

```javascript
```
</details>


### .fetchGrandArenaBracket(eventID, groupID)
<details><summary>Returns the specified GAC bracket leaderboard. Can only be retrieved during the event and on returns data for that specific GAC.</summary>

#### Parameters
`eventID` _String_\
The event id and instance id from the `.fetchEvents` method.

`groupID` _String_\
The event id, instance id, league name, and bracket number 0+ separated by :

```javascript
```
</details>


### .fetchGrandArenaLeaderboards(league, division, enums)
<details><summary>Returns the specified Top 50 Grand Arena League and Division Leaderboard.</summary>

#### Parameters
`league` _Integer_\
The numeric value for the league.
> 20 = Carbonite\
> 40 = Bronzium\
> 60 = Chromium\
> 80 = Aurodium\
> 100 = Kyber

`division` _Integer_\
The numeric value for the division.
> 5 = 5\
> 10 = 4\
> 15 = 3\
> 20 = 4\
> 25 = 1

```javascript
```
</details>


### .fetchGuildLeaderboards(type, month, count, event, enums)
<details><summary>Returns the specified guild leaderboard</summary>

`type` _Integer_\
The type of leaderboard to get.
> 0 = Total Raid Points\
> 2 = Specified Raid Points\
> 3 = Galactic Power\
> 4 = Territory Battle\
> 5 = Territory Wars

`month` _Integer_ | **Optional**\
Indicates returning this month or previous
> 0 = Current month\
> 1 = Previous month

`count` _Integer_ | **Optional**\
The number of results tp return. Default and max is 200.

`event` _String_ | **Required for `types` 2, 4, and 5\
The id of the event to get.
> RAIDS (2)\
> `sith_raid` = Sith Triumverate\
> `rancor` = The Pit\
> `aat` = Tank Takedown\
> `rancor_challenge` = The Pit: Challenge Tier\
> TERRITORY BATTLES (4)\
> `t01D` = Rebel Assault\
> `t02D` = Imperial Retaliation\
> `t03D` = Separatist Might\
> `t04D` = Republic Offensive\
> `t05D` = Rise of the Empire\
> TERRITORY WARS (5)\
> `TERRITORY_WAR_LEADERBOARD` = Territory War

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.

```javascript
```
</details>


### .fetchLocalization(language)
<details><summary>Returns the game data in the specified language for some values.</summary>

#### Parameters
`language` _String_
The ISO 639 language code and ISO 3166 country code for the language. Default is "ENG_US". The default is to use the language setting setup during initializing the class.
</details>


### .fetchEnums()
Returns the enum values in the data which are named values versus integer values.\
Currently not available for SWGoH Comlink for GitHub users. You would enable the enums in the parameters for it so it saves them to your forked repo.


### .getModSetDefinitions()
Returns an object with deatils on mod sets. Set names can be localized.


### .getStatDefinitions()
Returns an object with details on stats.Stat names can be localized.
