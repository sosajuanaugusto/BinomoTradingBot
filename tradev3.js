const puppeteer = require("puppeteer");
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
        timeout: 120000,
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
        timeout: 120000,
    });

    console.log(
        `[ ${moment().format("HH:mm:ss")} ] `,
        chalk.green("Trading en una cuenta demo")
    );

    console.log(
        `[ ${moment().format("HH:mm:ss")} ] `,
        chalk.green("Start Trading...")
    );

    await delay(2000);

    let montosCompensar = ["1000", "2200", "4400", "8800", "17600"];

    await page.evaluate(`document.querySelector("[id='amount-counter']").value = ${montosCompensar[0]}`)
    await page.evaluate(`document.querySelector("[id='amount-counter']").dispatchEvent(new Event('input'))`)

    // await page.evaluate(`document.querySelector("[id='amount-counter']").value = ${montosCompensar[0]}`)
    // await page.click("vui-input-number > input[type=text]");

    console.log("");
    const time = new Date();
    const timer = 60 * 1000 - (time.getSeconds() * 1000 + time.getMilliseconds());
    await delay(timer);
    let type = false;
    let j = 0;
    let i = 0;
    let totalGanado = 0;
    let totalPerdido = 0;

    while (true) {

        // await new Promise(resolve => setTimeout(resolve, 10000)); //espero 10 segundos para tener el balance actualizado
        let balance = await page.evaluate(          //STOP LOSE
            () => document.querySelector("[id='qa_trading_balance']").innerText
        );
        let balanceLimpio = balance.replace(/[^\d]/g, '').toString().slice(0, -2);
        let saldo = parseInt(balanceLimpio);
        console.log(`__________________________________________`);
        console.log("");
        console.log(`              Saldo: $${saldo.toLocaleString()}`);

        if (saldo < 2140041) {
            console.log("Saldo menor a $2.140.041. Deteniendo la ejecución...");
            break; // Detener el bucle 2239041
        }

        await page.waitForSelector('#trade-menu > majority-opinion > div > div > div.label > span.call');
        const buy = await page.evaluate(() => {
            const buyElement = document.querySelector('#trade-menu > majority-opinion > div > div > div.label > span.call');
            return buyElement ? buyElement.innerText.replace('%', '') : '';
        });

        await page.waitForSelector("#trade-menu > majority-opinion > div > div > div.label > span.put");
        const sell = await page.evaluate(() => {
            const sellElement = document.querySelector("#trade-menu > majority-opinion > div > div > div.label > span.put");
            return sellElement ? sellElement.innerText.replace('%', '') : '';
        });
        console.log(`              ${chalk.green(`${buy}%`)}  -----  ${chalk.red(`${sell}%`)}`);


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
            console.log(
                `[ ${moment().format("HH:mm:ss")} ] `,
                chalk.green(`Comprar a las ${moment().format("HH:mm:ss")} ...`)
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
                console.log(`              ${chalk.red(`Pérdida: $${montosCompensar[i]}`)}`);
                totalPerdido += parseInt(montosCompensar[i]);

                i++;
                j++;
                compensar = true;
            } else {
                console.log(`              ${chalk.cyan(`Ganancia $${resultado}`)}`);
                totalGanado += parseInt(resultado.split(',')[0].replace(/[^\d]/g, ''));

                if (i > 0) compensar = true;
                j = 0;
                i = 0;
            }
            if (i == 5) i = 0;   // si quiero cambiar la cantidad de montos de la lista
            console.log(`              ${chalk.black.bgGreen(`Total ganado: $${totalGanado.toLocaleString()}`)}`);
            console.log(`              ${chalk.black.bgRed(`Total perdido: $${totalPerdido.toLocaleString()}`)}`);
            console.log(`              ${chalk.black.bgYellow(`Balance : $${(totalGanado - totalPerdido).toLocaleString()}`)}`);
            console.log(`              Próxima apuesta $${montosCompensar[i]}`);
            console.log("");

            // ----------------------------------------------------- VENTA ----------------------------------------------------------


        } else if (type == false) {
            console.log(
                `[ ${moment().format("HH:mm:ss")} ] `,
                chalk.magenta(`Vender  $${montosCompensar[i]} a las ${moment().format("HH:mm:ss")} ...`)

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
                console.log(`              ${chalk.red(`Pérdida: $${montosCompensar[i]}`)}`);
                totalPerdido += parseInt(montosCompensar[i]);
                i++;
                j++;
                compensar = true;
            } else {
                console.log(`              ${chalk.cyan(`Ganancia $${resultado}`)}`);
                totalGanado += parseInt(resultado.split(',')[0].replace(/[^\d]/g, ''));
                if (i > 0) compensar = true;
                j = 0;
                i = 0;
            }
            if (i == 5) i = 0;
            console.log(`              ${chalk.black.bgGreen(`Total ganado: $${totalGanado.toLocaleString()}`)}`);
            console.log(`              ${chalk.black.bgRed(`Total perdido: $${totalPerdido.toLocaleString()}`)}`);
            console.log(`              ${chalk.black.bgYellow(`Balance : $${(totalGanado - totalPerdido).toLocaleString()}`)}`);
            console.log(`              Próxima apuesta $${montosCompensar[i]}`);
            console.log("");
        }


        if (compensar) {

            await page.evaluate(`document.querySelector("[id='amount-counter']").value = ${montosCompensar[i]}`)
            await page.evaluate(`document.querySelector("[id='amount-counter']").dispatchEvent(new Event('input'))`)

            // await page.evaluate(`document.querySelector("[id='amount-counter']").value = ${montosCompensar[i]}`)
            // await page.click("vui-input-number > input[type=text]");
            //Cuenta demo 2.244
        }



    }
})();