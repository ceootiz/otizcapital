export const commerceChartData = [
  { month: "Jan", capital: 4.2, volume: 5.1 },
  { month: "Feb", capital: 5.4, volume: 6.3 },
  { month: "Mar", capital: 6.8, volume: 8.1 },
  { month: "Apr", capital: 7.2, volume: 9.4 },
  { month: "May", capital: 8.6, volume: 11.0 },
  { month: "Jun", capital: 9.8, volume: 12.7 },
  { month: "Jul", capital: 11.4, volume: 14.9 },
  { month: "Aug", capital: 12.8, volume: 16.2 }
];

export const allocationRows = [
  {
    id: "OC-AL-1842",
    cycle: "Apple devices",
    marketplace: "Amazon / eBay",
    capital: "$420K",
    status: "Procurement",
    progress: 46
  },
  {
    id: "OC-AL-1818",
    cycle: "Creator bundles",
    marketplace: "Walmart Marketplace",
    capital: "$310K",
    status: "In transit",
    progress: 68
  },
  {
    id: "OC-AL-1796",
    cycle: "Refurb premium",
    marketplace: "Back Market",
    capital: "$265K",
    status: "Marketplace sale",
    progress: 82
  }
];

export const operationEvents = [
  {
    time: "09:30",
    title: "Batch received at NJ warehouse",
    detail: "146 serialized tablets entered quality review",
    state: "Verified"
  },
  {
    time: "11:45",
    title: "Marketplace settlement posted",
    detail: "Cycle OC-AL-1772 moved to reporting close",
    state: "Settled"
  },
  {
    time: "14:20",
    title: "Outbound shipment cleared",
    detail: "Creator bundle inventory routed to fulfillment",
    state: "In transit"
  }
];

export const proofSignals = [
  "Shipment media",
  "Warehouse scans",
  "Marketplace statements",
  "Payout records",
  "Serial checks"
];
