const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const cheerio = require("cheerio");

BOT_TOKEN = "6784176342:AAGWXqMnydL2NXrFnv1geiTd7ICI9zJZxvQ";

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome!"));

bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query;

  if (query) {
    const url = `https://banglaplex.fun/home/autocompleteajax?term=${query}`;

    try {
      const response = await axios.get(url);
      const results = response.data;

      // Create an array of promises to fetch and process each URL
      const promises = results.map(async (result, index) => {
        try {
          const response = await axios.get(result.url);
          const $ = cheerio.load(response.data);
          const title = $(".title").text().trim().toUpperCase();

          if (title) {
            const description =
              $(".col-md-9 .col-md-12 p:nth-of-type(2)").text().trim() || "";
            const image = $(".col-md-3 img").attr("src") || "";
            const duration =
              $("div.col-md-6:nth-of-type(2) p:nth-of-type(1)")
                .text()
                .trim()
                .split(":") || "";
            const imdb =
              $("div.col-md-6:nth-of-type(2) p:nth-child(4)").text().trim() ||
              "";
            const release =
              $(".col-md-6.text-left p:nth-child(6)")
                .text()
                .trim()
                .split(":") || "";
            const quality = $("p span.label").text().trim() || "";
            const video = $("iframe").attr("src") || result.url;

            function formatDownloadLink(link) {
              return link
                .replace(/-/, "")
                .replace(/-/, " (")
                .replace(/-/, ") - ");
            }
            const downloadLinks = $("#download a").map(function () {
              const href = $(this).attr("href");
              const serverName = $(this).text().toUpperCase();
              return {
                href: href,
                serverName: formatDownloadLink(serverName),
              };
            });

            const downloadLinksArray = downloadLinks.get();
            const downloadButtonMarkup = downloadLinksArray.map((link) => {
              const { href, serverName } = link;
              return [Markup.button.url(serverName, href)];
            });

            const streamButton = Markup.button.url("Stream Now", video);

            const message = `<b>${title}</b>\n<b>➥ Rating:</b> <i>${imdb}</i>\n<b>➥ Duration:</b> <i>${duration[1].trim()}</i>\n<b>➥ Quality:</b> <i>${quality}</i>\n<b>➥ Release Date:</b> <i>${release[1].trim()}</i>\n<b>➥ Description: </b><i>${description}</i>`;

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

bot.launch();
