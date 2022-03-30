const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const websiteLink =
  "https://enchulate.com.ar/productos.php?t=00007&Venta=Viajes";
async function scrape(link = `${websiteLink}&pagina=`) {
  let products = [];
  async function run() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    async function getPageData(pageNumber = 0) {
      //GET TOTAL PAGES
      await page.goto(`${link}${pageNumber}`);

      try {
        await page.waitForSelector(".paginador a");
        let $pagination = await page.$$(".paginador a");
        const totalPages = await (
          await $pagination[$pagination.length - 2].getProperty("innerHTML")
        ).jsonValue();

        console.log("There is pagination");

        //GET PRODUCTS
        const data = await page.evaluate(() => {
          const $products = document.querySelectorAll("article.articulo");
          const dataList = [];

          $products.forEach(async (element) => {
            let detailsLink = `https://enchulate.com.ar/${element
              .querySelector("a")
              .getAttribute("href")}`;

            dataList.push(detailsLink);
          });

          return {
            products: dataList,
          };
        });
        //SAVE PRODUCTS IN ARRAY
        products = [...products, ...data.products];
        console.log(`page ${pageNumber} of ${totalPages} completed`);

        //ASK FOR NEW PAGES.
        if (pageNumber < totalPages) {
          await getPageData(pageNumber + 1);
        } else {
          fs.writeFile(
            path.join(__dirname, "./data.js"),
            `${JSON.stringify(products)}`,
            () => {
              console.log("data written");
              return;
            }
          );
          await browser.close();
        }
      } catch {
        try {
          console.log("There is not pagination");
          //GET PRODUCTS
          const data = await page.evaluate(() => {
            const $products = document.querySelectorAll("article.articulo");
            const dataList = [];

            $products.forEach(async (element) => {
              let detailsLink = `https://enchulate.com.ar/${element
                .querySelector("a")
                .getAttribute("href")}`;

              dataList.push(detailsLink);
            });

            return {
              products: dataList,
            };
          });
          //SAVE PRODUCTS IN ARRAY
          products = [...products, ...data.products];
          fs.writeFile(
            path.join(__dirname, "./links.js"),
            `${JSON.stringify(products)}`,
            () => {
              console.log("data written");
              return;
            }
          );
        } catch (error) {
          console.log(error);
        }
      }
    }
    await getPageData();
  }
  await run();
}

scrape();
