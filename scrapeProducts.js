const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  let products = [];

  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1900, height: 800 });

  const productsArray = [
    "https://enchulate.com.ar/detalle.php?id=145-1002X2&Influencer=Set-de-2-Valijas-20-y-24-Pulgadas",
    "https://enchulate.com.ar/detalle.php?id=1-26674&Head=Set-de-Valijas-x-2-unid",
    "https://enchulate.com.ar/detalle.php?id=1-26668&Discovery=Carry-On",
    "https://enchulate.com.ar/detalle.php?id=10036&Travel-Tech=Cubre-Valijas",
    "https://enchulate.com.ar/detalle.php?id=10038&Travel-Tech=Cubre-Valijas",
    "https://enchulate.com.ar/detalle.php?id=10039&Travel-Tech=Cubre-Valijas",
  ];

  for (const element of productsArray) {
    await page.goto(element);

    await page.waitForSelector(".detalle");
    await page.waitForTimeout(500);

    $talles = await page.$$eval("#talle > option", (options) => {
      return options.map((option) => option.text);
    });
    let stockArray = [];

    for (let i = 0; i < $talles.length; i++) {
      if ($talles[i].includes("Sin Stock")) {
        continue;
      } else {
        let $stock = await page.$eval("#cantidad", (el) => el.children.length);
        await page.click("#talle");
        await page.waitForTimeout(500);
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(500);
        await page.keyboard.press("Enter");
        stockArray.push($stock);
      }
    }

    const data = await page.evaluate(
      async (stockArray, $talles) => {
        const dataList = [];

        const $product = document.querySelector(".detalle");

        let name = $product.querySelector(".detalles h3").textContent.trim();
        let brand = $product.querySelector(".detalles h2").textContent.trim();
        let code = $product.querySelector(".detalles #hart").textContent.trim();
        let categories = $product.querySelectorAll(".detalles .bread a");
        let parentCategory = categories[0].textContent.trim();
        let childCategory = categories[1].textContent.trim();
        let price = $product
          .querySelector(".detalles #htotalprecio")
          .textContent.trim();
        let image = $product.querySelector(".detalle-img").src;
        let labels = $product.querySelectorAll(".detalles form select");

        let quantity;
        const stock = [];

        if (labels.length > 1) {
          const $tallesConStock = $talles.filter(
            (talle) => !talle.includes("Sin Stock")
          );

          for (let i = 0; i < $tallesConStock.length; i++) {
            stock.push({
              talle: $tallesConStock[i],
              quantity: stockArray[i],
            });
          }
        } else {
          quantity = $product.querySelector("#cantidad").children.length;
        }

        dataList.push({
          name: name,
          code: code,
          brand: brand,
          parentCategory: parentCategory,
          childCategory: childCategory,
          price: price,
          imgUrl: image,
          quantity: quantity || "",
          stock: stock || "",
        });

        return {
          products: dataList,
        };
      },
      stockArray,
      $talles
    );
    products = [...products, ...data.products];
  }

  fs.writeFile(
    path.join(__dirname, "./products.js"),
    `${JSON.stringify(products)}`,
    () => {
      console.log("data written");
      return;
    }
  );
  await page.waitForTimeout(5 * 1000);
  await browser.close();
})().catch((error) => {
  console.error("Something bad happend...", error);
});
