const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config({
  path: "./.env",
});

const express = require("express");
const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);
const port = process.env.PORT || 3000;

bot.start((ctx) => ctx.reply("Welcome to Bangla Plex Bot!"));

bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query;

  if (query) {
    const url = `https://banglaplexapi.bymirrorx.eu.org/search?q=${query}`;

    try {
      const response = await axios.get(url);
      const results = response.data;

      const promises = results.map(async (result, index) => {
        try {
          const response = await axios.get("https://banglaplexapi.bymirrorx.eu.org" + result.url);
          
          const title = response.data.title.toUpperCase();

          if (title) {
            const description = response.data.description || "";
            const image = response.data.image || "";
            const duration = response.data.duration || "";
            const imdb = response.data.imdb || "";
            const release = response.data.release || "";
            const quality = response.data.quality || "";
            const video = response.data.stream || result.url;
            const downloadLinksArray = response.data.downloadLinks;
            const downloadButtonMarkup = downloadLinksArray.map((link) => {
              const { dlUrl, dlServer } = link;
              return [Markup.button.url(dlServer, dlUrl)];
            });

            const streamButton = Markup.button.url("Stream Now", video);

            const message = `<b>${title}</b>\n<b>➥ Rating:</b> <i>${imdb}</i>\n<b>➥ Duration:</b> <i>${duration}</i>\n<b>➥ Quality:</b> <i>${quality}</i>\n<b>➥ Release Date:</b> <i>${release}</i>\n<b>➥ Description: </b><i>${description}</i>`;

            return {
              type: "article",
              id: index.toString(),
              title: title,
              description: description,
              thumb_url: image,
              input_message_content: {
                message_text: `${message}`,
                parse_mode: "HTML",
              },
              reply_markup: {
                inline_keyboard: downloadButtonMarkup.concat([[streamButton]]),
              },
            };
          }
        } catch (error) {
          console.error("Error processing URL:", result.url, error);
        }

        return null;
      });

      const inlineQueryResults = (await Promise.all(promises)).filter(
        (result) => result !== null
      );

      ctx.answerInlineQuery(inlineQueryResults, { cache_time: 0 });
    } catch (error) {
      console.error(error);
    }
  }
});

app.get("/", (req, res) => {
  res.send(`Bangla Plex Bot is Running on port ${port}!`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
bot.launch();
