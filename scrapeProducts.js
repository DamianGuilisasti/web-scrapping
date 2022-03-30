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
    "https://enchulate.com.ar/detalle.php?id=10036&Travel-Tech=Cubre-Valijas",
  ];

  for (const element of productsArray) {
    await page.goto(element);

    await page.waitForSelector(".detalle");
    await page.waitForTimeout(500);

    $talles = await page.$eval("#talle", (el) => el.children.length);
    let stockArray = [];

    for (let i = 0; i < $talles; i++) {
      let withoutStock = await page.$eval("#talle option", (el) => el.text); //chequear si tengo "sin stock".
      console.log(withoutStock);
      let $stock = await page.$eval("#cantidad", (el) => el.children.length);
      await page.click("#talle");
      await page.waitForTimeout(500);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(500);
      await page.keyboard.press("Enter");
      stockArray.push($stock);
    }

    const data = await page.evaluate(async (stockArray) => {
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
      let talleOptions;

      if (labels.length > 1) {
        talleOptions = $product
          .querySelector("#talle")
          .textContent.replace(/[\n\t\r]/g, "")
          .trim()
          .split(/[ ,]+/);

        for (let i = 0; i < talleOptions.length; i++) {
          stock.push({
            talle: talleOptions[i],
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
    }, stockArray);
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
