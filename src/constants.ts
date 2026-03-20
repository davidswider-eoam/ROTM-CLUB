import type { Subscriber, Catalog } from './types';

export const MONTHS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];

export const CATALOG: Catalog = {
  "2025-11": { artist: "Unknown Artist", album: "November Record", label: "TBD", wholesaleCost: 0 },
  "2025-12": { artist: "Unknown Artist", album: "December Record", label: "TBD", wholesaleCost: 0 },
  "2026-01": { 
    artist: "Freewheelin' Bob Dylan", 
    album: "The Freewheelin' Bob Dylan", 
    label: "Columbia",
    wholesaleCost: 18.50,
    contact: "Sony/Columbia Representative",
    notes: "Classic reissue, high demand."
  },
  "2026-02": { 
    artist: "Rod Smoth", 
    album: "New Waves", 
    label: "Merge Records",
    wholesaleCost: 16.00,
    contact: "Merge Records (orders@mergerecords.com)",
    notes: "Limited edition blue vinyl."
  },
  "2026-03": { 
    artist: "Alabaster DePlume", 
    album: "Gold", 
    label: "International Anthem",
    wholesaleCost: 21.00,
    contact: "Intl Anthem (Chicago Office)",
    notes: "Double LP set."
  },
  "2026-04": { artist: "Unknown Artist", album: "April Record", label: "TBD", wholesaleCost: 0 },
};

export const SUBSCRIBERS: Subscriber[] = [
  { id:"1", order:"15116", billing:"Riley Bertauski", billingEmail:"cannonhuntsmusic@gmail.com", recipient:"Cannon Hunt", recipientEmail:"", type:"3-month", delivery:"ship", start:"2025-11", end:"2026-01", notes:"gift for Cannon Hunt", flag:false },
  { id:"2", order:"15406", billing:"Jennifer Davis", billingEmail:"jfdavis2@gmail.com", recipient:"Randy Marshall", recipientEmail:"", type:"3-month", delivery:"ship", start:"2025-12", end:"2026-02", notes:"gift for Randy Marshall", flag:false },
  { id:"3", order:"15328", billing:"Graham Dunlap", billingEmail:"graham.dunlap@gmail.com", recipient:"Austin & Jenn Rae", recipientEmail:"", type:"3-month", delivery:"ship", start:"2025-12", end:"2026-02", notes:"", flag:false },
  { id:"4", order:"15174", billing:"Matt Farage", billingEmail:"", recipient:"Matt Farage", recipientEmail:"", type:"12-month", delivery:"ship", start:"2025-02", end:"2026-02", notes:"", flag:false },
  { id:"5", order:"15364", billing:"Ryan Sharpe", billingEmail:"imp_@yahoo.com", recipient:"Ryan Sharpe", recipientEmail:"", type:"monthly", delivery:"pickup", start:"2025-12", end:null, notes:"ASK TORI ABOUT THIS ONE", flag:true },
  { id:"6", order:"15452", billing:"Rachel Bronstein", billingEmail:"rmbronstein@gmail.com", recipient:"Bharat Ayyar", recipientEmail:"", type:"3-month", delivery:"ship", start:"2026-01", end:"2026-03", notes:"gift for Bharat Ayyar", flag:false },
  { id:"7", order:"15460", billing:"Scott Rinicker", billingEmail:"sdrinick@gmail.com", recipient:"Scott Rinicker", recipientEmail:"", type:"3-month", delivery:"ship", start:"2026-01", end:"2026-03", notes:"", flag:false },
  { id:"8", order:"15462", billing:"Jennie Goloboy", billingEmail:"goloboy@earthlink.net", recipient:"Jennie Goloboy", recipientEmail:"", type:"3-month", delivery:"ship", start:"2025-11", end:"2026-01", notes:"*renewed with order #15462", flag:false },
  { id:"9", order:"15475", billing:"Benton Green", billingEmail:"bgreen630@gmail.com", recipient:"Benton Green", recipientEmail:"", type:"3-month", delivery:"pickup", start:"2026-01", end:"2026-03", notes:"", flag:false },
  { id:"10", order:"15176", billing:"Robert & Ashley Helm", billingEmail:"", recipient:"Robert & Ashley Helm", recipientEmail:"", type:"12-month", delivery:"ship", start:"2025-05", end:"2026-04", notes:"", flag:false },
  { id:"11", order:"INSTORE", billing:"Tom Speed", billingEmail:"tomspeed@gmail.com", recipient:"Tom Speed", recipientEmail:"", type:"12-month", delivery:"pickup", start:"2025-12", end:"2027-12", notes:"instore purchase", flag:false },
  { id:"12", order:"15572", billing:"Jason Fine", billingEmail:"jasonlfine@gmail.com", recipient:"Jason Fine", recipientEmail:"", type:"12-month", delivery:"ship", start:"2026-02", end:"2027-02", notes:"FREE RECORD DEAL (2 records)", flag:true },
];
