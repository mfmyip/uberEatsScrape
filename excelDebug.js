import exceljs from "exceljs";

async function getRowIndex(receipts) {
  // open excel
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.readFile('C:/Users/murph/OneDrive/Shared Expenses.xlsx');
  const ws = workbook.getWorksheet('Orders');
  const wsItems = workbook.getWorksheet('Orders.Items');

  // add rows
  console.log(ws.lastRow.number);
  console.log(wsItems.lastRow.number);

  // write to excel
  return 0;
} 

async function getLastDateInExcel(service = 'UberEats') {
  // open excel
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.readFile('C:/Users/murph/OneDrive/Shared Expenses.xlsx');
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

await getRowIndex();
console.log(await getLastDateInExcel());

