let receipt = {};
receipt["costItems"] = {};
receipt["costItems"]["ITEMNAME"] = "CA$0.00";

let r1 = {
  id: 'a2391eea-6cc0-4392-976d-c29e37c76b52',
  date: 'July 17, 2023',
  restaurant: 'A&W (Victoria St. N)',
  subtotal: 'CA$64.26',
  payments: [ 'CA$33.53' ],
  costItems: {
    'Mozza Burger® Combo': 'CA$29.66',
    '5 Chicken Strips Combo': 'CA$34.60',
    'Service fee': 'CA$4.00',
    'Delivery fee': 'CA$0.49',
    Tax: 'CA$4.76',
    Tip: 'CA$5.00'
  },
  discounts: [ '-CA$32.13', '-CA$12.85' ]
}
let r2 = {
  id: '123123213a-6cc0-4392-976d-c29e37c76b52',
  date: 'July 11, 2023',
  restaurant: 'A&W (Victoria St. N)',
  subtotal: 'CA$64.26',
  payments: [ 'CA$33.53' ],
  costItems: {
    'MEALONE': 'CA$29.66',
    'MEALTWO': 'CA$34.60',
    'Service fee': 'CA$4.00',
    'Delivery fee': 'CA$0.49',
    Tax: 'CA$4.76',
    Tip: 'CA$5.00'
  },
  discounts: [ '-CA$32.13', '-CA$12.85' ]
}
let r = [r1, r2];

let lastDateToGet = new Date("2023-07-20 23:59:59");
// console.log(new Date(r1["date"]));
// console.log(lastDateToGet);
// console.log(new Date(r1["date"]) < lastDateToGet)

console.trace();