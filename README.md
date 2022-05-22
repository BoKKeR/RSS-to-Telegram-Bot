![RSSTT](https://github.com/BoKKeR/RSS-to-Telegram-Bot/raw/master/rsstt.png)




![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/bokker/rss-to-telegram-bot?label=release) ![Docker Pulls](https://img.shields.io/docker/pulls/bokker/rss.to.telegram) ![Docker Stars](https://img.shields.io/docker/stars/bokker/rss.to.telegram) ![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/BoKKeR/RSS-to-telegram-Bot/master/master) ![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/bokker/rss.to.telegram) 
# RSS to Telegram bot

A self-hosted telegram JavaScript/TypeScript bot that dumps posts from RSS feeds to a telegram chat. 
This script was created because all the third party services were unreliable.

![help](img/help.png)

### Docker

For the docker image go to: https://hub.docker.com/r/bokker/rss.to.telegram/

### Installation

Dont forget to use the right node version. `nvm use` or match the version in `.nvmrc`

```sh
npm install
cp .env.example .env
npm run dev
```

Dont forget to fill the .env file

A telegram bot is needed that the script will connect to. https://botsfortelegram.com/project/the-bot-father/
Running the script and typing in /help will reveal all the commands

1. Clone the script
2. Save and run
3. Use the telegram commands to manage feeds

# Known issues

There are no known issues but the telegram API has limitations on how many messages per chat you can receive

# Docker

```
docker create \
  --name=rss.to.telegram \
  -e TOKEN=InsertToken \
  -e DEBUG=false \
  -v /path/to/host/config:/app/config \
  --restart unless-stopped \
  bokker/rss.to.telegram
```

# Development

To run the project locally you can fill the .env.example file, and rename it to .env, this allows you to run the script locally with `npm start`

## Prisma

Prisma is used to manage SQLite structure changes and as a ORM

To create any change you need to do the following:

1. Backup current database
2. Alter the prisma.schema
3. `npx prisma migrate dev -n migration-name`
4. test the migration on an old version of the database `npx prisma migrate deploy`
5. test the migration by having no database `npx prisma migrate deploy`