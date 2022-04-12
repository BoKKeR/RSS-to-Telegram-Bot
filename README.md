![RSSTT](https://github.com/BoKKeR/RSS-to-Telegram-Bot/raw/master/rsstt.png)




![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/bokker/rss-to-telegram-bot?label=release) ![Docker Pulls](https://img.shields.io/docker/pulls/bokker/rss.to.telegram) ![Docker Stars](https://img.shields.io/docker/stars/bokker/rss.to.telegram) ![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/BoKKeR/RSS-to-telegram-Bot/master/master) ![Docker Image Size (latest by date)](https://img.shields.io/docker/image-size/bokker/rss.to.telegram) 
# RSS to Telegram bot

A self-hosted telegram JavaScript/TypeScript bot that dumps posts from RSS feeds to a telegram chat. This script was created because all the third party services were unreliable.

![Image of help menu](https://bokker.github.io/telegram.png)

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
Running the script and typing in /help will reveal the current chatId, this needs to be set also in the script

1. Clone the script
2. Replace your chatID and Token on the top of the script.
3. Edit the delay. (seconds)
4. Save and run
5. Use the telegram commands to manage feeds

Warning! Without chatID the bot wont be able to send automated messages and will only be able to respond to messages.

# Usage

send /help to the bot to get this message:

```
RSS to Telegram bot v2.0.0

After successfully adding a RSS link, the bot starts fetching the feed every 10 seconds. (This can be changed)

Titles are used to easily manage RSS feeds and need to contain only one word

commands:
/help shows this help message
/add title http://www.RSS-URL.com
/remove link_name removes the RSS link, multiple links can be removed with one command
/list Lists all the titles and the RSS links from the DB
/test Inbuilt command that fetches a post from Reddits RSS.

The current chatId is: 2032xxxx

```

# Known issues

There are no known issues.

# Docker

```
docker create \
  --name=rss.to.telegram \
  -e DELAY=60 \
  -e TOKEN=InsertToken \
  -e DEBUG=true \
  -e CHATID=InsertChatID \
  -v /path/to/host/config:/app/config \
  --restart unless-stopped \
  bokker/rss.to.telegram
```
