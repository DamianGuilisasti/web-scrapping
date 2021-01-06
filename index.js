const puppeteer = require("puppeteer");
const fs = require("fs");

//VARIABLES
let products = [];

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //LOGIN
  await page.goto("https://targetmodaweb.com/carrito/");
  await page.waitForSelector("#login");
  await page.type("#user_login", "user", { delay: 100 });
  await page.type("#user_pass", "password", { delay: 100 });
  await page.click("#wp-submit");

  //START SCRAPING

  async function getPageData(pageNumber = 1) {
    await page.goto(
      `https://targetmodaweb.com/carrito/categoria-producto/decohome/organizadores-home/page/${pageNumber}`
    );

    //GET PAGE NUMBERS
    await page.waitForSelector(".woocommerce-pagination a.page-numbers");
    let $pagination = await page.$$(
      ".woocommerce-pagination ul li a.page-numbers"
    );
    const totalPages = await (
      await $pagination[$pagination.length - 2].getProperty("innerHTML")
    ).jsonValue();

    //GET PRODUCTS
    const data = await page.evaluate(() => {
      const $products = document.querySelectorAll("li.product-small");
      const dataList = [];

      $products.forEach(($product) => {
        let imgUrl300 = $product
          .querySelector(".attachment-shop_catalog")
          .getAttribute("src");
        let imgUrl600 = imgUrl300.replace("300x300", "600x600");

        dataList.push({
          name: $product.querySelector(".name").textContent,
          price: $product.querySelector(".amount").textContent,
          imgUrl: imgUrl600,
        });
      });
      return {
        products: dataList,
      };
    });
    //SAVE PRODUCTS IN ARRAY
    products = [...products, ...data.products];
    console.log(`page ${pageNumber} of ${totalPages} completed`);

    //ASK FOR MORE PAGES
    if (pageNumber < totalPages) {
      getPageData(pageNumber + 1);
    } else {
      fs.writeFile(
        "data.js",
        `export default ${JSON.stringify(products)}`,
        () => {
          console.log("data written");
        }
      );
      await browser.close();
    }
  }
  getPageData();
}

run();


