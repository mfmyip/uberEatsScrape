import puppeteer from "puppeteer";
import exceljs from "exceljs";
import fs from "fs";
import { setTimeout } from "timers/promises";
import { TimeoutError } from "puppeteer";

main();

async function main() {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./user_data"
  });
  let page = await browser.newPage();
  // Set screen size
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0');
  await page.setViewport({width: 1920, height: 1400});

  const user = '';
  const pw = '';
  // Navigate the page to the login URL
  await page.goto('https://www.doordash.com/en-CA/orders', {
    waitUntil: 'domcontentloaded'
  });
  //await login(user, pw, page);
  // let lastDateInExcel = await getLastDateInExcel("UberEats");
  // let lastDateToGet = lastDateInExcel ? lastDateInExcel : new Date("2022-06-20 23:59:59");
  // console.log("Getting orders starting from: " + lastDateToGet);
  // let receipts = await getOrders(page, lastDateToGet);
  // await uploadToSheets(receipts);
  // await page.close();
  // await browser.close();
}

async function login(username, password, page) {
  // wait for login button to show up
  await page.waitForSelector('#guided-submit-button', {visible: true});
  // input phone number and click continue
  let userInput = await page.$('[type="email"][autocomplete="username"]');
  if (userInput) await userInput.type(username, {delay: 50});

  await page.click('#guided-submit-button');

  await page.waitForSelector('#login-submit-button', {visible: true});
  let passwordInput = await page.$('[type="password"][autocomplete="current-password"]');
  if (passwordInput) await passwordInput.type(password, {delay: 50});

  await page.click('#login-submit-button');
}
function textBetween(text, start, end) {
  return text.substring(text.indexOf(start) + start.length, text.indexOf(end));
}

async function getOrders(page, lastDateToGet = new Date()) {
  await page.waitForSelector('#main-content').then(() => console.log("main-content loaded"));
  await setTimeout(1000);
  // selectors
  const viewReceiptSelector = "//a[contains(., 'View receipt')]";
  const showMoreSelector = "#main-content > div > button";
  const headerSelector = ".Uber18_p3.header_h3";
  const restaurantSelector = ".Uber18_text_p1.header_Uber18_text_p1";
  const totalsSelector = ".Uber18_text_p3";
  const costsSelector = ".Uber18_text_p1.black";
  const discountsSelector = ".Uber18_text_p1.green";
  const dateSelector = "span.Uber18_text_p1";
  const showMoreItemsSelectorXPath = "//div[contains(@class, 'bo bp d1 di al aq if bc') and contains(text(), 'Show more')]";
  const ordersSelector = "#main-content > div > div.al"; // [0] is text header, [1] is first order
  const itemsOrderSelector = "div.al.am.bh > div > div.dh > div > ul > li > div > div" // can contain "Show more"

  // get receipts
  let receipts = [];
  let counter = 0;
  let finished = false;
  while (!finished) {
    // wait for "Show more" button to show up, means page is loaded
    await page.waitForSelector(showMoreSelector, {visible: true});

    // Click on any "Show more"s to expand the order
    // let orders = (await page.$$(ordersSelector)).slice(1);
    // let showMoreItems = await page.$x(showMoreItemsSelectorXPath);
    // showMoreItems.forEach(async (showMoreItem, i) => await showMoreItem.click());
    let viewReceiptLinks = await page.$x(viewReceiptSelector);
    console.log("# receipts found: " + viewReceiptLinks.length);

    // loop through each receipt
    for (let i = counter; i < viewReceiptLinks.length; i++) {
      await viewReceiptLinks[i].click();
      // wait for view receipt iframe to load
      const iframeHandle = await page.waitForSelector("iframe", {visible: true});
      const frame = await iframeHandle.contentFrame();

      // wait for header to show
      await frame.waitForSelector(headerSelector, {visible: true});

      // operations
      console.log("receipt counter: " + counter);
      let receipt = {"service": "UberEats"};
      // grab id
      let url = await page.url();
      receipt["id"] = textBetween(url, "modctx=", "&ps=1");
      // grab date
      receipt["date"] = await frame.$eval(dateSelector, el => el.textContent);
      // restaurant
      const restaurantText = await frame.$eval(restaurantSelector, el => el.textContent);
      receipt["restaurant"] = textBetween(restaurantText, "from ", " and ");
      // price totals
      const totals = await frame.$$(totalsSelector);
      receipt["subtotal"] = await totals[1].evaluate(el => el.textContent);
      receipt["payments"] = [];
      for (let i = 2; i < totals.length; i++) {
        let totalText = await totals[i].evaluate(el => el.textContent);
        receipt["payments"].push(totalText);
      }
      // costs
      const costs = await frame.$$(costsSelector);
      receipt["costItems"] = {};
      for (let i = 0; i < costs.length; i++) {
        let costText = await costs[i].evaluate(el => el.textContent);
        if (costText.indexOf("CA$") === 0) {
          let costItem = await costs[i-1].evaluate(el => el.textContent);
          receipt["costItems"][costItem.toUpperCase()] = costText;
        }
      }
      // discounts
      receipt["discounts"] = [];
      const discounts = await frame.$$(discountsSelector);
      for (var discount of discounts) {
        let discountText = await discount.evaluate(el => el.textContent);
        receipt["discounts"].push(discountText);
      }
      // go back
      await page.goBack();
      await page.waitForSelector("iframe", {hidden: true});

      // set finished flag
      if (new Date(receipt["date"]) <= lastDateToGet) {
        console.log("FINISHED");
        finished = true;
        break;
      }

      counter++;
      receipts.push(receipt);

      // logging
      console.log(receipt["restaurant"]);
      console.log(receipt["date"]);
    }
    
    let showmore = await page.$(showMoreSelector);
    await showmore.click();
  }
  return receipts;
}

function cadToNum(cad) {
  return parseFloat(cad.replace('CA$', ''));
}
function formatReceipts(receipts) {
  receipts.forEach(receipt => {
    receipt["date"] = new Date(receipt["date"]);
    receipt["subtotal"] = cadToNum(receipt["subtotal"]);
    receipt["payments"] = receipt["payments"].map(p => cadToNum(p));
    receipt["discounts"] = receipt["discounts"].map(d => cadToNum(d));
    receipt["costItems"] = Object.fromEntries(
      Object.entries(receipt["costItems"]).map(([key, value]) => [key, cadToNum(value)])
    );
  });
  return receipts;
}

function getItems(receipt) {
  let items = Object.entries(receipt["costItems"])
                .filter(([k, v]) => k !== "SERVICE FEE" && k !== "DELIVERY FEE" && k !== "TAX" && k !== "TIP");
  
  items.forEach((item, i, a) => {
    a[i] = [receipt["service"], receipt["id"], item[0], item[1]]
  });
  return items;
}

/**
 * 
 * @param {*} receipt 
 */
async function uploadToSheets(receipts) {
  // open excel
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.readFile('./Shared Expenses.xlsx');
  const ws = workbook.getWorksheet('Orders');
  const wsItems = workbook.getWorksheet('Orders.Items');

  // add rows
  console.log(ws.lastRow.number);
  formatReceipts(receipts);
  ws.addRows(receipts.map(receipt => {
    return [
      receipt["service"],
      receipt["id"],
      receipt["restaurant"],
      receipt["date"],
      receipt["payments"].reduce((a, b) => a + b, 0),
      receipt["subtotal"],
      receipt["costItems"]["SERVICE FEE"],
      receipt["costItems"]["DELIVERY FEE"],
      receipt["costItems"]["TAX"],
      receipt["costItems"]["TIP"],
      receipt["discounts"].reduce((a, b) => a + b, 0),
    ];
  }));
  wsItems.addRows(
    receipts
      .map(receipt => getItems(receipt))
      .flat()
  );

  // write to excel
  console.log("writing to excel");
  workbook.xlsx.writeFile('./Shared Expenses.xlsx')
    .then(() => {console.log("done");});
  return 0;
} 

async function getLastDateInExcel(service = 'UberEats') {
  // open excel
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.readFile('./Shared Expenses.xlsx');
  const orders = workbook.getWorksheet('Orders');

  // get service
  let serviceCol = orders.getColumn(1).values.slice(2);
  let dateCol = orders.getColumn(4).values.slice(2).map(v => new Date(v));
  let largestDate = Math.min(...dateCol);
  let largestIdx = -1;
  for (let i = 0; i < serviceCol.length; i++) {
    if (serviceCol[i] === service && dateCol[i] > largestDate) {
      largestDate = dateCol[i];
      largestIdx = i + 2; // off by 2 in excel structure
    }
  }
  console.log({
    largestDate: largestDate,
    largestIdx: largestIdx,
  });

  // get last date
  return largestIdx > 0 ? 
    new Date(orders.getRow(largestIdx).getCell(4).value) : 
    null;
}
