/* STREAMING_CHUNK:Initializing Data Layer (LocalStorage & State Management) /
/*

=======================================================

DATA LAYER (Information Storage & State Management)

=======================================================

Responsible for handling reading/writing parameter state

to browser LocalStorage.
*/
const DataLayer = {
STORAGE_KEY: 'mgis_130_loan_calc_state',

// Default Fallback Input Values
defaults: {
amount: 250000,
rate: 6.5,
term: 30
},

// Load state from local persistent storage
loadInputs() {
try {
const saved = localStorage.getItem(this.STORAGE_KEY);
return saved ? JSON.parse(saved) : this.defaults;
} catch (err) {
console.error("DataLayer Error: Failed to read from localStorage", err);
return this.defaults;
}
},

// Save state to local persistent storage
saveInputs(data) {
try {
localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
} catch (err) {
console.error("DataLayer Error: Failed to save to localStorage", err);
}
},

// Clear persistent storage
clearStorage() {
try {
localStorage.removeItem(this.STORAGE_KEY);
} catch (err) {
console.error("DataLayer Error: Failed to clear storage", err);
}
}
};

/* STREAMING_CHUNK:Initializing Processing Layer (Business Logic) /
/*

===============================================================

PROCESSING LAYER (Business Logic & Mathematical Calculations)

===============================================================

Performs formulas, schedule derivations, zero-rate edge cases,

and currency conversions.
/
const ProcessingLayer = {
/*

Calculates monthly payments and generates amortization schedule.

Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
*/
calculateLoan(principal, annualRate, years) {
// Input Validation & Sanitization
const P = Math.max(0, parseFloat(principal) || 0);
const r = Math.max(0, parseFloat(annualRate) || 0) / 100 / 12;
const n = Math.max(1, (parseInt(years, 10) || 1) * 12);

let monthlyPayment = 0;

// Zero-Interest Rate Edge Case Handling
if (r === 0) {
monthlyPayment = P / n;
} else {
const compoundFactor = Math.pow(1 + r, n);
monthlyPayment = P * (r * compoundFactor) / (compoundFactor - 1);
}

const totalRepayment = monthlyPayment * n;
const totalInterest = Math.max(0, totalRepayment - P);

// Generate First 12 Months Amortization Schedule Preview
const schedule = [];
let balance = P;

for (let month = 1; month <= Math.min(n, 12); month++) {
const interestForMonth = balance * r;
const principalForMonth = monthlyPayment - interestForMonth;
balance = Math.max(0, balance - principalForMonth);

 schedule.push({
     month,
     payment: monthlyPayment,
     principal: principalForMonth,
     interest: interestForMonth,
     balance: balance
 });


}

return {
monthlyPayment,
totalInterest,
totalRepayment,
principal: P,
schedule
};
},

// Formats numbers to USD Currency String
formatCurrency(amount) {
return new Intl.NumberFormat('en-US', {
style: 'currency',
currency: 'USD',
maximumFractionDigits: 2
}).format(amount);
}
};

/* STREAMING_CHUNK:Initializing User Interface Layer (DOM Binding) /
/*

=======================================================

USER INTERFACE LAYER (DOM Updates & Event Routing)

=======================================================

Connects input elements to calculations and renders data onto the screen.
*/
const UILayer = {
// DOM Element References
amountInput: document.getElementById('loan-amount'),
amountSlider: document.getElementById('loan-amount-slider'),
amountBadge: document.getElementById('amount-badge'),

rateInput: document.getElementById('interest-rate'),
rateSlider: document.getElementById('interest-rate-slider'),
rateBadge: document.getElementById('rate-badge'),

termInput: document.getElementById('loan-term'),
resetBtn: document.getElementById('reset-btn'),

outputMonthly: document.getElementById('output-monthly'),
outputInterest: document.getElementById('output-interest'),
outputInterestPercent: document.getElementById('output-interest-percent'),
outputTotal: document.getElementById('output-total'),

barPrincipal: document.getElementById('bar-principal'),
barInterest: document.getElementById('bar-interest'),
lblPrincipalVal: document.getElementById('lbl-principal-val'),
lblInterestVal: document.getElementById('lbl-interest-val'),

scheduleBody: document.getElementById('schedule-body'),

init() {
// Load initial inputs from Data Layer
const saved = DataLayer.loadInputs();
this.setFormValues(saved);

 // Bind interactive UI listeners
 this.bindEvents();

 // Perform initial calculation and render
 this.updateAndRender();


},

setFormValues(data) {
this.amountInput.value = data.amount;
this.amountSlider.value = data.amount;
this.rateInput.value = data.rate;
this.rateSlider.value = data.rate;
this.termInput.value = data.term;
},

bindEvents() {
// Synchronize Loan Amount Inputs
this.amountInput.addEventListener('input', (e) => {
this.amountSlider.value = e.target.value;
this.updateAndRender();
});
this.amountSlider.addEventListener('input', (e) => {
this.amountInput.value = e.target.value;
this.updateAndRender();
});

 // Synchronize Interest Rate Inputs
 this.rateInput.addEventListener('input', (e) => {
     this.rateSlider.value = e.target.value;
     this.updateAndRender();
 });
 this.rateSlider.addEventListener('input', (e) => {
     this.rateInput.value = e.target.value;
     this.updateAndRender();
 });

 // Term Select Change Listener
 this.termInput.addEventListener('change', () => {
     this.updateAndRender();
 });

 // Reset Parameters Listener
 this.resetBtn.addEventListener('click', () => {
     DataLayer.clearStorage();
     this.setFormValues(DataLayer.defaults);
     this.updateAndRender();
 });


},

/* STREAMING_CHUNK:Rendering Calculations to UI */
updateAndRender() {
// 1. Gather values from UI inputs
const amount = parseFloat(this.amountInput.value) || 0;
const rate = parseFloat(this.rateInput.value) || 0;
const term = parseInt(this.termInput.value, 10) || 5;

 // 2. Update UI Badge Displays
 this.amountBadge.textContent = ProcessingLayer.formatCurrency(amount);
 this.rateBadge.textContent = `${rate}%`;

 // 3. Persist Input State via Data Layer
 DataLayer.saveInputs({ amount, rate, term });

 // 4. Calculate Results via Processing Layer
 const results = ProcessingLayer.calculateLoan(amount, rate, term);

 // 5. Render Calculated Metrics to UI
 this.outputMonthly.textContent = ProcessingLayer.formatCurrency(results.monthlyPayment);
 this.outputInterest.textContent = ProcessingLayer.formatCurrency(results.totalInterest);
 this.outputTotal.textContent = ProcessingLayer.formatCurrency(results.totalRepayment);

 // 6. Update Visual Breakdown Bar Ratios
 const total = results.totalRepayment || 1;
 const principalPct = ((results.principal / total) * 100).toFixed(1);
 const interestPct = ((results.totalInterest / total) * 100).toFixed(1);

 this.barPrincipal.style.width = `${principalPct}%`;
 this.barInterest.style.width = `${interestPct}%`;

 this.lblPrincipalVal.textContent = ProcessingLayer.formatCurrency(results.principal);
 this.lblInterestVal.textContent = ProcessingLayer.formatCurrency(results.totalInterest);
 this.outputInterestPercent.textContent = `${interestPct}% of total cost`;

 // 7. Render Schedule Table Body
 this.scheduleBody.innerHTML = results.schedule.map(row => `
     <tr class="hover:bg-slate-50 transition-colors">
         <td class="px-4 py-2.5 font-medium text-slate-800">Month ${row.month}</td>
         <td class="px-4 py-2.5 font-semibold text-slate-900">${ProcessingLayer.formatCurrency(row.payment)}</td>
         <td class="px-4 py-2.5 text-blue-600">${ProcessingLayer.formatCurrency(row.principal)}</td>
         <td class="px-4 py-2.5 text-amber-600">${ProcessingLayer.formatCurrency(row.interest)}</td>
         <td class="px-4 py-2.5 font-mono text-slate-700">${ProcessingLayer.formatCurrency(row.balance)}</td>
     </tr>
 `).join('');


}
};

/* STREAMING_CHUNK:App Entry Point Launch Listener */
// Initialize Application upon DOM Readiness
document.addEventListener('DOMContentLoaded', () => UILayer.init());
