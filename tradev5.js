const puppeteer = require("puppeteer"); //Cuenta demo 604.640,22
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
    readlineSync.question("Press enter if done login...");
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
  let montoApostar = montoFijo;
  let perdidasConsecutivas = 0;
  let usarAntimartingala = false;

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
  const timer = 60 * 1000 - (time.getSeconds() * 1000 + time.getMilliseconds());
  await delay(timer);
  let type = false;
  let j = 0;
  let saldo;

  while (true) {
    let strSaldo = await page.evaluate(
      () => document.querySelector("[id='qa_trading_balance']").innerText
    );
    saldo = parseInt(strSaldo.replace(/[^\d]/g, "").toString().slice(0, -2));

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
      `              ${chalk.green(`${buy}%`)}  -----  ${chalk.red(`${sell}%`)}`
    );

    let compensar = false;
    if (j > 1) {
      j = 0;
      type = !type;
    }

    if (parseInt(sell) < 50) {
      type = true; // Comprar
    } else {
      type = false; // Vender
    }

    // ----------------------------------------------------- COMPRA ----------------------------------------------------------

    if (type == true) {
      if (usarAntimartingala) {
        montoApostar = Math.floor(montoApostar / 2.5); // Reducir monto de apuesta
      } else {
        montoApostar = Math.floor(montoApostar * 2.5); // Martingala
      }

      try {
        console.log(
          `[ ${moment().format("HH:mm:ss")} ] `,
          chalk.green(
            `Comprar $${montoApostar} a las ${moment().format("HH:mm:ss")} ...`
          )
        );
        await page.evaluate(() =>
          document.querySelector("#qa_trading_dealUpButton > button").click()
        );
        await delay(55000);
        await page.waitForSelector("div > span.currency", { visible: true });
        const resultado = await page.evaluate(
          () => document.querySelector("div > span.currency").innerText
        );
        if (resultado == "0,00 Arg$") {
          console.log(chalk.red(`              Pérdida: $${montoApostar}`));
          perdidasConsecutivas++;

          if (perdidasConsecutivas >= 4) {
            if (usarAntimartingala) {
              usarAntimartingala = false;
              console.log(chalk.yellow("Cambiar a técnica martingala"));
            } else {
              usarAntimartingala = true;
              console.log(chalk.blue("Cambiar a técnica antimartingala"));
            }
            perdidasConsecutivas = 0;
          }
        } else {
          console.log(chalk.cyan(`              Ganancia $${resultado}`));
          perdidasConsecutivas = 0;
          montoApostar = montoFijo;
          if (usarAntimartingala) {
            montoApostar = montoApostar * 2.5;
          }
        }
      } catch (error) {
        console.log(
          `              ${chalk.white.bgRed(
            `WARNING: No se encontró el último resultado en la página.`
          )}`
        );
        console.log(`              ${chalk.white(`Reiniciando...`)}`);
        continue;
      }

      console.log(`              Próxima apuesta $${montoApostar}`);
      console.log("");

      // ----------------------------------------------------- VENTA ----------------------------------------------------------
    } else if (type == false) {
      if (usarAntimartingala) {
        montoApostar = Math.floor(montoApostar / 2.5); // Reducir monto de apuesta
      } else {
        montoApostar = Math.floor(montoApostar * 2.5); // Martingala
      }
      try {
        console.log(
          `[ ${moment().format("HH:mm:ss")} ] `,
          chalk.magenta(
            `Vender  $${montoApostar} a las ${moment().format("HH:mm:ss")} ...`
          )
        );
        await page.evaluate(() =>
          document.querySelector("#qa_trading_dealDownButton > button").click()
        );
        await delay(55000);
        await page.waitForSelector("div > span.currency", { visible: true });
        const resultado = await page.evaluate(
          () => document.querySelector("div > span.currency").innerText
        );
        if (resultado == "0,00 Arg$") {
          console.log(chalk.red(`              Pérdida: $${montoApostar}`));
          perdidasConsecutivas++;

          if (perdidasConsecutivas >= 4) {
            if (usarAntimartingala) {
              usarAntimartingala = false;
              console.log(chalk.yellow("Cambiar a técnica martingala"));
            } else {
              usarAntimartingala = true;
              console.log(chalk.blue("Cambiar a técnica antimartingala"));
            }
            perdidasConsecutivas = 0;
          }
        } else {
          console.log(chalk.cyan(`              Ganancia $${resultado}`));
          perdidasConsecutivas = 0;
          montoApostar = montoFijo;
          if (usarAntimartingala) {
            montoApostar = montoApostar * 2.5;
          }
        }
      } catch (error) {
        console.log(
          `              ${chalk.white.bgRed(
            `WARNING: No se encontró el último resultado en la página.`
          )}`
        );
        console.log(`              ${chalk.white(`Reiniciando...`)}`);
        continue;
      }
      //if (i == 6) i = 0; // si quiero cambiar la cantidad de montos de la lista

      console.log(`              Próxima apuesta $${montoApostar}`);
      console.log("");
    }

    await page.evaluate((monto) => {
      const amountInput = document.querySelector("[id='amount-counter']");
      amountInput.value = monto;
      amountInput.dispatchEvent(new Event("input"));
    }, montoApostar);
  }
})();
