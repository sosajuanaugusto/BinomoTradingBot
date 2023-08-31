const puppeteer = require("puppeteer"); //Cuenta demo $2.721.235  30/08
const moment = require("moment");
const chalk = require("chalk");
const delay = require("delay");
const readlineSync = require("readline-sync");

(async () => {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
    "--disable-accelerated-2d-canvas",
    "--no-zygote",
    "--no-first-run",
    "--disable-dev-shm-usage",
    "--window-size=1920x1080",
  ];

  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    userDataDir: "./tmp",
    slowMo: 0,
    devtools: false,
    args,
  });

  const pages = await browser.pages();
  const page = pages[0];
  page.setDefaultNavigationTimeout(0);
  await page.goto("https://binomo-web.com/trading", {
    waitUntil: "networkidle0",
    timeout: 80000,
  });

  let loginRequired = false;

  if ((await page.$("#qa_auth_LoginBtn > button")) !== null) {
    console.log(
      `[ ${moment().format("HH:mm:ss")} ] `,
      chalk.yellow("Debes iniciar sesión primero")
    );
    loginRequired = true;
  } else {
    loginRequired = false;
  }

  if (loginRequired) {
    readlineSync.question("Presionar enter luego de loguear...");
    console.log("");

    if ((await page.$("#avatar > vui-badge > vui-avatar > img")) !== null) {
      await page.evaluate(() =>
        document.querySelector("#avatar > vui-badge > vui-avatar > img").click()
      );
    } else {
      await page.evaluate(() =>
        document
          .querySelector("#avatar > vui-badge > vui-avatar > span")
          .click()
      );
    }

    await page.waitForSelector(
      "#qa_header_MiniProfileDropdown > div.popover_body__3GBGJ > div > div.personal-information> div.wrap > div > p.name"
    );
    let loginName = await page.$(
      "#qa_header_MiniProfileDropdown > div.popover_body__3GBGJ > div > div.personal-information > div.wrap > div > p.name"
    );
    let loginNameValue = await page.evaluate((el) => el.textContent, loginName);
    console.log(
      `[ ${moment().format("HH:mm:ss")} ] `,
      chalk.green(`Ha iniciado sesión como : ${loginNameValue}`)
    );
  } else {
    if ((await page.$("#avatar > vui-badge > vui-avatar > img")) !== null) {
      await page.evaluate(() =>
        document.querySelector("#avatar > vui-badge > vui-avatar > img").click()
      );
    } else {
      await page.evaluate(() =>
        document
          .querySelector("#avatar > vui-badge > vui-avatar > span")
          .click()
      );
    }
    await page.waitForSelector(
      "#qa_header_MiniProfileDropdown > div.popover_body__3GBGJ > div > div.personal-information > div.wrap > div > p.name"
    );
    let loginName = await page.$(
      "#qa_header_MiniProfileDropdown > div.popover_body__3GBGJ > div > div.personal-information > div.wrap > div > p.name"
    );
    let loginNameValue = await page.evaluate((el) => el.textContent, loginName);
    console.log(
      `[ ${moment().format("HH:mm:ss")} ] `,
      chalk.green(`Ha iniciado sesión como : ${loginNameValue}`)
    );
  }

  await page.goto("https://binomo-web.com/trading", {
    waitUntil: "networkidle0",
    timeout: 80000,
  });

  let montoFijo = parseInt(readlineSync.question("Ingrese el monto fijo: "));
  let montoCompra = parseInt(readlineSync.question("Ingrese el porcentaje para la compra: "));
  let montoVenta = parseInt(readlineSync.question("Ingrese el porcentaje para la venta: "));
  let montoApostar = montoFijo;
  let perdidasConsecutivas = 0;

  console.log(
    `[ ${moment().format("HH:mm:ss")} ] `,
    chalk.green("Trading en una cuenta demo")
  );

  console.log(
    `[ ${moment().format("HH:mm:ss")} ] `,
    chalk.green("Start Trading...")
  );

  await page.evaluate(
    `document.querySelector("[id='amount-counter']").value = ${montoApostar}`
  );
  await page.evaluate(
    `document.querySelector("[id='amount-counter']").dispatchEvent(new Event('input'))`
  );

  // await page.evaluate(`document.querySelector("[id='amount-counter']").value = ${montosCompensar[0]}`)
  // await page.click("vui-input-number > input[type=text]");

  console.log("");
  const time = new Date();
  const timer = 60 * 100 - (time.getSeconds() * 100 + time.getMilliseconds());
  await delay(timer);
  let type = false;
  let saldo;
  let operar = false;

  // Definir una función para observar cambios en el precio
  async function observePriceChanges() {
    let sellPriceAnterior = NaN; // Inicializar sellPriceAnterior aquí
    let buyPriceAnterior = NaN; // Inicializar buyPriceAnterior aquí

    while (true) {
      try {
        await page.waitForSelector(
          "#trade-menu > majority-opinion > div > div > div.label > span.put",
          { visible: true }
        );

        const newSellPriceText = await page.evaluate(() => {
          const sellPriceElement = document.querySelector(
            "#trade-menu > majority-opinion > div > div > div.label > span.put"
          );
          return sellPriceElement.textContent;
        });

        const newBuyPriceText = await page.evaluate(() => {
          const buyPriceElement = document.querySelector(
            "#trade-menu > majority-opinion > div > div > div.label > span.call"
          );
          return buyPriceElement.textContent;
        });

        const newSellPrice = parseFloat(newSellPriceText);
        const newBuyPrice = parseFloat(newBuyPriceText);

        if (
          newSellPrice !== sellPriceAnterior ||
          newBuyPrice !== buyPriceAnterior
        ) {
          //console.log(`Nuevo precio de venta: ${newSellPrice}`);
          //console.log(`Nuevo precio de compra: ${newBuyPrice}`);
          sellPriceAnterior = newSellPrice; // Actualizar sellPriceAnterior aquí
          buyPriceAnterior = newBuyPrice; // Actualizar buyPriceAnterior aquí

          // Operar en función de los precios
          if (newSellPrice > montoVenta) {
            // Realizar la venta
            //console.log("Realizando venta...");
            type = false; // Vender
            operar = true;
            break;
          } else if (newBuyPrice > montoCompra) {
            // Realizar la compra
            //console.log("Realizando compra...");
            type = true; // Comprar
            operar = true;
            break;
          } else {
            // No hacer nada si no se cumple ninguna condición
            console.log("No se cumple ninguna condición de compra/venta. Esperando...");
            operar = false;
          }
        }
      } catch (error) {
        console.log("Error al observar los precios:", error.message);
      }
    }
  }

  while (true) {
    // Lanzar la función de observación de precios en un nuevo hilo
    await observePriceChanges();

    while (!operar) {
      await observePriceChanges();
    }

    if (operar) {
      while (operar) {
        let strSaldo = await page.evaluate(
          () => document.querySelector("[id='qa_trading_balance']").innerText
        );
        saldo = parseInt(
          strSaldo.replace(/[^\d]/g, "").toString().slice(0, -2)
        );

        // if (saldo < parseInt(2000000)) {
        //  console.log("Saldo menor a $2.000.000 Deteniendo la ejecución...");
        //  break;
        //}

        console.log(`__________________________________________`);
        console.log("");
        console.log(`              Saldo: $${saldo.toLocaleString()}`);

        await page.waitForSelector(
          "#trade-menu > majority-opinion > div > div > div.label > span.call"
        );
        const buy = await page.evaluate(() => {
          const buyElement = document.querySelector(
            "#trade-menu > majority-opinion > div > div > div.label > span.call"
          );
          return buyElement ? buyElement.innerText.replace("%", "") : "";
        });

        await page.waitForSelector(
          "#trade-menu > majority-opinion > div > div > div.label > span.put"
        );
        const sell = await page.evaluate(() => {
          const sellElement = document.querySelector(
            "#trade-menu > majority-opinion > div > div > div.label > span.put"
          );
          return sellElement ? sellElement.innerText.replace("%", "") : "";
        });
        console.log(
          `              ${chalk.green(`${buy}%`)}  -----  ${chalk.red(
            `${sell}%`
          )}`
        );

        if (perdidasConsecutivas >= 4) {
          console.log(
            `              ${chalk.yellow(
              `Esperando que se estabilice la moneda...`
            )}`
          );
          await delay(180000);
        }

        // ----------------------------------------------------- COMPRA ----------------------------------------------------------

        if (type == true) {
          try {
            console.log(
              `[ ${moment().format("HH:mm:ss")} ] `,
              chalk.green(
                `Comprar $${montoApostar} a las ${moment().format(
                  "HH:mm:ss"
                )} ...`
              )
            );
            await page.evaluate(() =>
              document
                .querySelector("#qa_trading_dealUpButton > button")
                .click()
            );
            await delay(55000);
            await page.waitForSelector("div > span.currency", {
              visible: true,
            });
            const resultado = await page.evaluate(
              () => document.querySelector("div > span.currency").innerText
            );
            if (resultado == "0,00 Arg$") {
              console.log(chalk.red(`              Pérdida: $${montoApostar}`));
              perdidasConsecutivas++;
              montoApostar = Math.floor(montoApostar * 2.2); // Martingala
            } else {
              console.log(chalk.cyan(`              Ganancia $${resultado}`));
              perdidasConsecutivas = 0;
              montoApostar = montoFijo;
            }
          } catch (error) {
            console.log(
              `              ${chalk.white.bgRed(
                `WARNING: No se encontró el último resultado.`
              )}`
            );
            console.log(`              ${chalk.white(`Reiniciando...`)}`);
            operar = false;
            await observePriceChanges();
            break;
          }

          console.log(`              Próxima apuesta $${montoApostar}`);
          console.log("");

          // ----------------------------------------------------- VENTA ----------------------------------------------------------
        } else if (type == false) {
          try {
            console.log(
              `[ ${moment().format("HH:mm:ss")} ] `,
              chalk.magenta(
                `Vender  $${montoApostar} a las ${moment().format(
                  "HH:mm:ss"
                )} ...`
              )
            );
            await page.evaluate(() =>
              document
                .querySelector("#qa_trading_dealDownButton > button")
                .click()
            );
            await delay(55000);
            await page.waitForSelector("div > span.currency", {
              visible: true,
            });
            const resultado = await page.evaluate(
              () => document.querySelector("div > span.currency").innerText
            );
            if (resultado == "0,00 Arg$") {
              console.log(chalk.red(`              Pérdida: $${montoApostar}`));
              perdidasConsecutivas++;
              montoApostar = Math.floor(montoApostar * 2.2); // Martingala
            } else {
              console.log(chalk.cyan(`              Ganancia $${resultado}`));
              perdidasConsecutivas = 0;
              montoApostar = montoFijo;
            }
          } catch (error) {
            console.log(
              `              ${chalk.white.bgRed(
                `WARNING: No se encontró el último resultado en la página.`
              )}`
            );
            console.log(`              ${chalk.white(`Reiniciando...`)}`);
            operar = false;
            await observePriceChanges();
            break;
          }

          console.log(`              Próxima apuesta $${montoApostar}`);
          console.log("");
        }

        await page.evaluate((monto) => {
          const amountInput = document.querySelector("[id='amount-counter']");
          amountInput.value = monto;
          amountInput.dispatchEvent(new Event("input"));
        }, montoApostar);

        operar = false;
      }
    } else {
      // Esperar hasta que se cumpla la condición
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (operar) {
            clearInterval(interval);
            resolve();
          }
        }, 1000); // Intervalo de revisión en milisegundos
      });
      continue; // Vuelve a la siguiente iteración del bucle
    }
  }
})();
