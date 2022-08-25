# swgoh-comlink-wrapper-for-gas
Is a Google App Script gs file containing a class that can make interactions with SWGOH Comlink on Heroku and Github easier. It includes returning raw player profile data or adding important information to it.

### Limitiations
While the class contains the necessary code to grab the data from Heroku, [Google App Script has limitations](https://developers.google.com/apps-script/guides/services/quotas) that the current /localization and /data endpoints exceed. URL Fetch response size has a limit of 50mb which most data segments exceed and localization has to be unzipped and converted into text with .getDataAsString() which has a limit of 100mb which it greatly exceeds.

## Setup
Create a new script file in your Google App Script project and then copy and paste this ComlinkAPI.gs file into it. This file uses the ES6 so you must set your Google App Script project to utilize the V8 runtime, for instructions on how to do that check [developers.google.com](https://developers.google.com/apps-script/guides/v8-runtime#enabling_the_v8_runtime).

### Initialization
#### Parameters
`host` _String_\
The full url path that the api data resides on. This can be your Heroku App web address or your forked Github repository.\

`accessKey` _String_ | **Optional**\
The public key required if HMAC has been enabled for Comlink connections. Default is false.\

`secretKey` _String_ | **Optional**\
The private key required if HMAC has been enabled for Comlink connections. Default is false.\

`language` _String_ | **Optional**\
The language to localize the responses in. Default is "ENG_US".\
Options: CHS_CN, CHT_CN, ENG_US, FRE_FR, GER_DE, IND_ID, ITA_IT, JPN_JP, KOR_KR, POR_BR, RUS_RU, SPA_XM, THA_TH, TUR_TR

```javascript
const api = new ComlinkAPI(host, accessKey, secretKey, language);
```


## Methods
### .fetchPlayer(allyCode, enums, preBuild)
Returns the specified player profile from the api. Includes options for return the data with additional details. 
#### Parameters
`allyCode` _Integer_\
The player's ally code to retrieve data for\

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.\

`preBuild` _Bool_ | **Optional**\
Flag to return response with additional data that is all localized. Default is false.\
#### Return Value 
Returns the requested player profile in json format


### .fetchGuild(allyCode, enums, preBuild)
Returns the specified guild player profiles from the api. Currently only setup to work with SWGOH Comlink for GitHub repo. For Heroku you would send each allyCode to the .fetchPlayer() method.
#### Parameters
`allyCode` _Integer_\
The player's ally code to retrieve data for\

`enums` _Bool_ | **Optional**\
Flag to return enum values in the response. Currently not enabled for Github. If you want the Github data to use enums you must select it in the Command Line Tool when generating the player.json file. Default is false.\

`preBuild` _Bool_ | **Optional**\
Flag to return response with additional data that is all localized. Default is false.\
#### Return Value 
Returns the requested guild profiles in json format


### .fetchData(collections)
Returns the specified game data collections.

`collections` _Array_
An array of specified collection names, see [SWGOH Comlink Wiki](https://gitlab.com/swgoh-tools/swgoh-comlink/-/wikis/Game-Data) for full list.\
Also accepts the following named groups: 
* "for_gameData" = collections required for building gameData.json
* "for_conquest" - all collections related to Conquest
* "for_abilities" - all collections related to unit abilities
* "for_territoryBattles" - all collectons related to Territory Battles
* "for_playerProfile" - all collections used to expand player data
* "for_datacrons" - all collections related to Datacrons
* "for_grandArena" - all collections related to Grand Arena

#### Return Value 
Returns the requested collections in json format.


### .fetchEnums()
Returns the enum values in the data which are named values versus integer values.\
Currently not available for SWGoH Comlink for GitHub users. You would enable the enums in the parameters for it so it saves them to your forked repo.


### .fetchLocalization(language)
Returns the game data in the specified language for some values.

`language` _String_
The ISO 639 language code and ISO 3166 country code for the language. Default is "ENG_US". The default is to use the language setting setup during initializing the class.


### .getModSetDefinitions()
Returns an object with deatils on mod sets. Set names can be localized.

### .getStatDefinitions()
Returns an object with details on stats.Stat names can be localized.
