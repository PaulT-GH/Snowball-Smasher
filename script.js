document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const currencySelector = document.getElementById('currencySelector');
    const payoffStrategyInput = document.getElementById('payoffStrategy'); // New strategy selector
    const numCreditCardsInput = document.getElementById('numCreditCards');
    const generateCardInputsButton = document.getElementById('generateCardInputs');
    const debtInputsContainer = document.getElementById('debtInputsContainer');
    const addUnsecuredDebtButton = document.getElementById('addUnsecuredDebt');
    const unsecuredDebtList = document.getElementById('unsecuredDebtList');
    const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
    const annualBonusAmountInput = document.getElementById('annualBonusAmount');
    const annualBonusMonthInput = document.getElementById('annualBonusMonth');
    const addLumpSumButton = document.getElementById('addLumpSum');
    const lumpSumsContainer = document.getElementById('lumpSumsContainer');
    const calculateButton = document.getElementById('calculateButton');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    const summaryText = document.getElementById('summaryText');
    const paymentScheduleTableBody = document.querySelector('#paymentSchedule tbody');
    const debtChartCanvas = document.getElementById('debtChart');
    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportCsvButton = document.getElementById('exportCsvButton');

    // State Variables
    let selectedCurrencySymbol = '$';
    let debtChart = null;
    let unsecuredDebtCount = 0;
    let lumpSumCount = 0;
    let paymentScheduleForExport = [];
    window.lastCalculationData = {};

    // --- Currency & Strategy Functions ---
    function updateCurrencyDisplay() {
        selectedCurrencySymbol = currencySelector.value;
        document.querySelectorAll('.currency-symbol').forEach(span => {
            span.textContent = selectedCurrencySymbol;
        });

        if (resultsSection.style.display !== 'none' && paymentScheduleForExport.length > 0 && window.lastCalculationData.totalInterest !== undefined) {
            displayResults(
                paymentScheduleForExport,
                window.lastCalculationData.totalInterest,
                window.lastCalculationData.totalMonths,
                window.lastCalculationData.chartData
            );
        }
    }

    // --- Event Listeners ---
    currencySelector.addEventListener('change', updateCurrencyDisplay);
    payoffStrategyInput.addEventListener('change', () => {
        // If results are shown, user might expect an auto-recalculation or a prompt.
        // For now, changing strategy requires a manual "Calculate" click.
        if (resultsSection.style.display !== 'none') {
            // Optionally prompt or clear results:
            // resultsSection.style.display = 'none';
            // summaryText.textContent = "Strategy changed. Please recalculate.";
        }
    });
    generateCardInputsButton.addEventListener('click', () => {
        const numCards = parseInt(numCreditCardsInput.value) || 0;
        generateDebtInputsUI(numCards, debtInputsContainer, 'card');
        updateCurrencyDisplay();
    });
    addUnsecuredDebtButton.addEventListener('click', () => {
        unsecuredDebtCount++;
        addDynamicDebtInputUI(unsecuredDebtList, 'unsecured', unsecuredDebtCount);
        updateCurrencyDisplay();
    });
    addLumpSumButton.addEventListener('click', () => {
        lumpSumCount++;
        addLumpSumInputUI(lumpSumCount);
        updateCurrencyDisplay();
    });
    calculateButton.addEventListener('click', calculateAndDisplayPayoff);
    saveButton.addEventListener('click', saveData);
    loadButton.addEventListener('click', loadData);
    resetButton.addEventListener('click', resetAll);
    exportPdfButton.addEventListener('click', exportToPDF);
    exportCsvButton.addEventListener('click', exportToCSV);

    // --- UI Generation Functions --- (Same as previous version)
    function generateDebtInputsUI(count, container, typePrefix) {
        container.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            addDynamicDebtInputUI(container, typePrefix, i);
        }
    }

    function addDynamicDebtInputUI(container, typePrefix, id) {
        const debtDiv = document.createElement('div');
        debtDiv.classList.add('debt-item');
        debtDiv.dataset.id = `${typePrefix}-${id}`;
        let title = typePrefix === 'card' ? `Credit Card ${id}` : `Unsecured Debt ${id}`;

        debtDiv.innerHTML = `
            <h3>${title}</h3>
            <label for="${typePrefix}Name${id}">Name:</label>
            <input type="text" id="${typePrefix}Name${id}" value="${title}" required>
            <label for="${typePrefix}Balance${id}">Balance (<span class="currency-symbol">${selectedCurrencySymbol}</span>):</label>
            <input type="number" id="${typePrefix}Balance${id}" step="0.01" min="0" required>
            <label for="${typePrefix}APR${id}">APR (%):</label>
            <input type="number" id="${typePrefix}APR${id}" step="0.01" min="0" required>
            <label for="${typePrefix}MinPayment${id}">Min. Payment (<span class="currency-symbol">${selectedCurrencySymbol}</span>):</label>
            <input type="number" id="${typePrefix}MinPayment${id}" step="0.01" min="0" required>
            ${typePrefix !== 'card' ? '<button class="remove-debt-item" data-type="unsecured">Remove</button>' : ''}
        `;
        container.appendChild(debtDiv);
        if (typePrefix !== 'card') {
            debtDiv.querySelector('.remove-debt-item').addEventListener('click', (e) => e.target.closest('.debt-item').remove());
        }
    }

    function addLumpSumInputUI(id) {
        const lumpSumDiv = document.createElement('div');
        lumpSumDiv.classList.add('lump-sum-item');
        lumpSumDiv.dataset.id = `lump-${id}`;
        lumpSumDiv.innerHTML = `
            <h3>Lump Sum ${id}</h3>
            <label for="lumpSumAmount${id}">Amount (<span class="currency-symbol">${selectedCurrencySymbol}</span>):</label>
            <input type="number" id="lumpSumAmount${id}" step="0.01" min="0">
            <label for="lumpSumMonth${id}">Month (1-12):</label>
            <select id="lumpSumMonth${id}">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${new Date(0, i).toLocaleString('default', { month: 'long' })}</option>`).join('')}
            </select>
            <button class="remove-lump-item">Remove</button>
        `;
        lumpSumsContainer.appendChild(lumpSumDiv);
        lumpSumDiv.querySelector('.remove-lump-item').addEventListener('click', (e) => e.target.closest('.lump-sum-item').remove());
    }

    // --- Data Collection Functions --- (Same as previous version)
     function getDebtsFromUI() {
        const debts = [];
        document.querySelectorAll('.debt-item').forEach(item => {
            const id = item.dataset.id;
            const type = id.split('-')[0];
            const numId = id.split('-')[1];
            const nameInput = document.getElementById(`${type}Name${numId}`);
            const balanceInput = document.getElementById(`${type}Balance${numId}`);
            const aprInput = document.getElementById(`${type}APR${numId}`);
            const minPaymentInput = document.getElementById(`${type}MinPayment${numId}`);

            if (!nameInput || !balanceInput || !aprInput || !minPaymentInput) return;

            const name = nameInput.value.trim();
            const balance = parseFloat(balanceInput.value);
            const apr = parseFloat(aprInput.value);
            const minPayment = parseFloat(minPaymentInput.value);

            if (name && !isNaN(balance) && balance > 0 && !isNaN(apr) && apr >= 0 && !isNaN(minPayment) && minPayment >= 0) {
                debts.push({
                    id: id, name: name, balance: balance, apr: apr,
                    minPayment: minPayment, monthlyInterestRate: apr / 12 / 100, paidOff: false
                });
            }
        });
        return debts;
    }

    function getLumpSumsFromUI() {
        const lumpSums = [];
        document.querySelectorAll('.lump-sum-item').forEach(item => {
            const id = item.dataset.id.split('-')[1];
            const amountInput = document.getElementById(`lumpSumAmount${id}`);
            const monthInput = document.getElementById(`lumpSumMonth${id}`);

            if (!amountInput || !monthInput) return;

            const amount = parseFloat(amountInput.value);
            const month = parseInt(monthInput.value);
            if (!isNaN(amount) && amount > 0 && !isNaN(month) && month >= 1 && month <= 12) {
                lumpSums.push({ amount, month });
            }
        });
        return lumpSums;
    }


    // --- Calculation Logic ---
    function calculateAndDisplayPayoff() { // Renamed from calculateAndDisplaySnowball
        paymentScheduleForExport = [];
        window.lastCalculationData = {};

        let debts = getDebtsFromUI();
        if (debts.length === 0) {
            alert("Please add at least one debt with a positive balance.");
            resultsSection.style.display = 'none';
            return;
        }

        const selectedStrategy = payoffStrategyInput.value;
        let extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value) || 0;
        const bonusAmount = parseFloat(annualBonusAmountInput.value) || 0;
        const bonusMonth = parseInt(annualBonusMonthInput.value) || 0;
        const lumpSums = getLumpSumsFromUI();

        // Sort debts based on selected strategy
        if (selectedStrategy === 'snowball') {
            debts.sort((a, b) => a.balance - b.balance); // Lowest balance first
        } else if (selectedStrategy === 'avalanche') {
            debts.sort((a, b) => { // Highest APR first
                if (b.apr === a.apr) { // Tie-breaker: lowest balance
                    return a.balance - b.balance;
                }
                return b.apr - a.apr;
            });
        }
        // If more strategies are added, include their sort logic here.

        let chartData = {
            labels: [],
            datasets: [{
                label: `Total Debt`,
                data: [],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1,
                fill: false
            }]
        };

        let currentMonthCount = 0;
        let currentYear = new Date().getFullYear();
        let totalInterestPaidGlobal = 0;
        let paymentPool = extraMonthlyPayment; // This is the extra payment pool

        while (debts.some(debt => !debt.paidOff)) {
            currentMonthCount++;
            let monthForCalendar = (currentMonthCount - 1) % 12 + 1;
            let yearForCalendar = currentYear + Math.floor((currentMonthCount - 1) / 12);

            chartData.labels.push(`${new Date(0, monthForCalendar - 1).toLocaleString('default', { month: 'short' })} ${yearForCalendar}`);

            let monthSpecificExtraPayment = paymentPool; // Start with the base extra payment
            if (bonusAmount > 0 && bonusMonth === monthForCalendar) monthSpecificExtraPayment += bonusAmount;
            lumpSums.forEach(ls => { if (ls.month === monthForCalendar) monthSpecificExtraPayment += ls.amount; });

            // 1. Accrue Interest
            debts.forEach(debt => {
                if (!debt.paidOff) {
                    const interestThisMonth = debt.balance * debt.monthlyInterestRate;
                    debt.balance += interestThisMonth;
                    totalInterestPaidGlobal += interestThisMonth;
                }
            });

            // 2. Make Payments
            let availableForTargetDebt = monthSpecificExtraPayment; // Money available to throw at the target debt (beyond its own min payment)
            let targetDebtIndex = debts.findIndex(d => !d.paidOff); // First non-paid off debt in the sorted list

            for (let i = 0; i < debts.length; i++) {
                const debt = debts[i];
                if (debt.paidOff) continue;

                let paymentAmount = 0;
                // Estimate interest portion for *this specific payment* if balance is not fully paid off by it
                // This is a simplification. True amortization splits vary.
                const estInterestPortionIfPartial = debt.balance * debt.monthlyInterestRate;

                if (i === targetDebtIndex) {
                    // Pay minimum on target + all available extra payment
                    paymentAmount = Math.min(debt.balance, debt.minPayment + availableForTargetDebt);
                } else {
                    // Pay minimum on other debts
                    paymentAmount = Math.min(debt.balance, debt.minPayment);
                }
                
                let interestPaidThisPayment;
                let principalPaidThisPayment;

                if (paymentAmount >= debt.balance) { // Paying off the debt
                    principalPaidThisPayment = debt.balance - (debt.balance / (1 + debt.monthlyInterestRate)) * debt.monthlyInterestRate; // Incorrect logic if fully paying off previous balance
                    // If paying off, the original balance (before this month's interest accrual) is the principal.
                    // The amount paid over that original balance (up to current balance) is interest.
                    // This calculation is tricky. Let's simplify:
                    // If paymentAmount >= debt.balance, all remaining debt.balance is principal + interest.
                    // The accrued interest was already added. So paymentAmount is reducing this new debt.balance.
                    // Interest portion of *this payment* should be based on balance *before* payment
                    // A simpler way:
                    let balanceBeforePayment = debt.balance; // This balance already includes accrued interest for the month
                    debt.balance -= paymentAmount;
                     // If we just paid it off, debt.balance is now <=0
                    if (debt.balance <= 0.005) {
                        // The payment covered the remaining balance.
                        // The portion of this *payment* that was interest vs principal:
                        // Interest for this month for this debt was already added to totalInterestPaidGlobal and debt.balance.
                        // The "interest paid this payment" is complex for the final payment.
                        // For simplicity, let's assume the payment clears the remaining balance.
                        // The principal portion of the payment is the original balance component.
                        // The interest portion of the payment is the interest accrued that month.
                        // This is difficult to perfectly isolate *within* this payment loop.
                        // The totalInterestPaidGlobal is more accurate for the overall picture.
                        // Let's assign based on the payment and reduction
                        principalPaidThisPayment = Math.min(paymentAmount, balanceBeforePayment); // Can't pay more principal than what was there
                        interestPaidThisPayment = Math.max(0, paymentAmount - principalPaidThisPayment); // This is not quite right for amortization schedule
                        // Let's use a more standard approach for amortization within the payment
                        interestPaidThisPayment = balanceBeforePayment * debt.monthlyInterestRate;
                        if (paymentAmount < interestPaidThisPayment) interestPaidThisPayment = paymentAmount; // If payment less than interest
                        principalPaidThisPayment = paymentAmount - interestPaidThisPayment;

                    } else {
                        interestPaidThisPayment = balanceBeforePayment * debt.monthlyInterestRate;
                        if (paymentAmount < interestPaidThisPayment) interestPaidThisPayment = paymentAmount;
                        principalPaidThisPayment = paymentAmount - interestPaidThisPayment;
                    }

                } else { // Not paying off the debt with this payment
                    debt.balance -= paymentAmount;
                    interestPaidThisPayment = paymentAmount * debt.monthlyInterestRate; // A common simplification
                     if (paymentAmount < debt.minPayment * debt.monthlyInterestRate) { // Approximation of interest part of min payment
                         interestPaidThisPayment = paymentAmount; // if payment is less than estimated interest
                         principalPaidThisPayment = 0;
                     } else {
                         // A more common approach:
                         interestPaidThisPayment = debt.balance * debt.monthlyInterestRate; // Interest on remaining after payment (for next cycle, not this payment)
                                                                                         // This is still not perfect for per-payment breakdown.
                                                                                         // Let's use interest accrued for the payment.
                        interestPaidThisPayment = (debt.balance + paymentAmount) * debt.monthlyInterestRate; // Interest on balance *before* this payment
                        if (paymentAmount < interestPaidThisPayment) interestPaidThisPayment = paymentAmount; // Cap interest paid at payment amount
                        principalPaidThisPayment = paymentAmount - interestPaidThisPayment;
                     }
                }
                 // Ensure principal is not negative
                principalPaidThisPayment = Math.max(0, principalPaidThisPayment);


                paymentScheduleForExport.push({
                    month: monthForCalendar, year: yearForCalendar, debtName: debt.name,
                    payment: paymentAmount,
                    interestPaid: Math.max(0,interestPaidThisPayment), // Ensure non-negative
                    principalPaid: Math.max(0,principalPaidThisPayment), // Ensure non-negative
                    remainingBalance: debt.balance > 0 ? debt.balance : 0,
                    totalDebtRemaining: 0
                });

                if (debt.balance <= 0.005) {
                    debt.balance = 0;
                    if (!debt.paidOff) {
                        paymentPool += debt.minPayment; // Add freed up min payment to the pool
                        debt.paidOff = true;
                        targetDebtIndex = debts.findIndex(d => !d.paidOff);
                    }
                }
            }

            const totalDebtRemainingEndOfMonth = debts.reduce((sum, d) => sum + d.balance, 0);
            for (let j = paymentScheduleForExport.length - 1; j >= 0; j--) {
                if (paymentScheduleForExport[j].month === monthForCalendar && paymentScheduleForExport[j].year === yearForCalendar) {
                    paymentScheduleForExport[j].totalDebtRemaining = totalDebtRemainingEndOfMonth;
                } else { break; }
            }
            chartData.datasets[0].data.push(totalDebtRemainingEndOfMonth);

            if (totalDebtRemainingEndOfMonth <= 0.005 || currentMonthCount > 12 * 70) {
                if (totalDebtRemainingEndOfMonth <= 0.005) chartData.datasets[0].data[chartData.datasets[0].data.length - 1] = 0;
                break;
            }
        }

        window.lastCalculationData = {
            totalInterest: totalInterestPaidGlobal,
            totalMonths: currentMonthCount,
            chartData: chartData
        };
        displayResults(paymentScheduleForExport, totalInterestPaidGlobal, currentMonthCount, chartData);
    }


    // --- Display Functions --- (Same as previous version, uses selectedCurrencySymbol)
    function displayResults(scheduleData, totalInterest, totalMonths, chartData) {
        resultsSection.style.display = 'block';
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        summaryText.textContent = `Debt-free in ${years} years, ${months} months. Total interest paid: ${selectedCurrencySymbol}${totalInterest.toFixed(2)}.`;

        paymentScheduleTableBody.innerHTML = '';
        let lastDisplayedTotalDebt = null;
        
        scheduleData.forEach(entry => {
            const row = paymentScheduleTableBody.insertRow();
            row.insertCell().textContent = new Date(0, entry.month - 1).toLocaleString('default', { month: 'long' });
            row.insertCell().textContent = entry.year;
            row.insertCell().textContent = entry.debtName;
            row.insertCell().textContent = `${selectedCurrencySymbol}${entry.payment.toFixed(2)}`;
            row.insertCell().textContent = `${selectedCurrencySymbol}${entry.interestPaid.toFixed(2)}`;
            row.insertCell().textContent = `${selectedCurrencySymbol}${entry.principalPaid.toFixed(2)}`;
            row.insertCell().textContent = `${selectedCurrencySymbol}${entry.remainingBalance.toFixed(2)}`;
            
            let totalDebtText = '-';
            // Show total debt if it's defined and either different from last row OR it's the last entry for that specific month/year combo
            const isLastEntryForMonthYear = !scheduleData.some(nextEntry => 
                nextEntry.month === entry.month && 
                nextEntry.year === entry.year && 
                scheduleData.indexOf(nextEntry) > scheduleData.indexOf(entry)
            );

            if (entry.totalDebtRemaining !== undefined) {
                if (entry.totalDebtRemaining !== lastDisplayedTotalDebt || isLastEntryForMonthYear) {
                    totalDebtText = `${selectedCurrencySymbol}${entry.totalDebtRemaining.toFixed(2)}`;
                    if (isLastEntryForMonthYear) { // Update lastDisplayedTotalDebt only if it's the final for this month
                        lastDisplayedTotalDebt = entry.totalDebtRemaining;
                    }
                } else if (lastDisplayedTotalDebt === null){ // First row with total debt
                     totalDebtText = `${selectedCurrencySymbol}${entry.totalDebtRemaining.toFixed(2)}`;
                     lastDisplayedTotalDebt = entry.totalDebtRemaining;
                }
            }
            row.insertCell().textContent = totalDebtText;
        });


        if (debtChart) debtChart.destroy();
        chartData.datasets[0].label = `Total Debt (${selectedCurrencySymbol})`;
        debtChart = new Chart(debtChartCanvas, {
            type: 'line', data: chartData,
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true, title: { display: true, text: `Total Debt (${selectedCurrencySymbol})` },
                        ticks: { callback: value => selectedCurrencySymbol + value.toFixed(0) }
                    },
                    x: { title: { display: true, text: 'Month' } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => `${context.dataset.label || ''}: ${selectedCurrencySymbol}${context.parsed.y.toFixed(2)}`
                        }
                    }
                }
            }
        });
    }

    // --- Local Storage Functions ---
    function saveData() {
        const dataToSave = {
            selectedCurrency: currencySelector.value,
            payoffStrategy: payoffStrategyInput.value, // Save strategy
            numCreditCards: numCreditCardsInput.value,
            debts: [], unsecuredDebts: [], extraMonthlyPayment: extraMonthlyPaymentInput.value,
            annualBonusAmount: annualBonusAmountInput.value, annualBonusMonth: annualBonusMonthInput.value,
            lumpSums: []
        };
        // ... (debt, unsecured debt, lump sum saving logic remains the same)
        document.querySelectorAll('#debtInputsContainer .debt-item').forEach(item => {
            const id = item.dataset.id.split('-')[1];
            dataToSave.debts.push({
                name: document.getElementById(`cardName${id}`).value, balance: document.getElementById(`cardBalance${id}`).value,
                apr: document.getElementById(`cardAPR${id}`).value, minPayment: document.getElementById(`cardMinPayment${id}`).value,
            });
        });
        document.querySelectorAll('#unsecuredDebtList .debt-item').forEach(item => {
            const id = item.dataset.id.split('-')[1];
            dataToSave.unsecuredDebts.push({
                origId: id, name: document.getElementById(`unsecuredName${id}`).value, balance: document.getElementById(`unsecuredBalance${id}`).value,
                apr: document.getElementById(`unsecuredAPR${id}`).value, minPayment: document.getElementById(`unsecuredMinPayment${id}`).value,
            });
        });
        document.querySelectorAll('#lumpSumsContainer .lump-sum-item').forEach(item => {
            const id = item.dataset.id.split('-')[1];
            dataToSave.lumpSums.push({
                origId: id, amount: document.getElementById(`lumpSumAmount${id}`).value, month: document.getElementById(`lumpSumMonth${id}`).value,
            });
        });
        localStorage.setItem('debtPayoffData', JSON.stringify(dataToSave)); // Changed key name slightly for clarity
        alert('Inputs saved successfully!');
    }

    function loadData() {
        const savedData = localStorage.getItem('debtPayoffData');
        if (!savedData) return;
        const data = JSON.parse(savedData);

        currencySelector.value = data.selectedCurrency || '$';
        payoffStrategyInput.value = data.payoffStrategy || 'snowball'; // Load strategy
        numCreditCardsInput.value = data.numCreditCards || 1;
        
        generateCardInputsButton.click(); // Regenerates inputs, currency display updated by its listener

        // ... (debt, unsecured debt, lump sum loading logic remains the same)
        (data.debts || []).forEach((debt, index) => {
            const id = index + 1;
            if (document.getElementById(`cardName${id}`)) {
                document.getElementById(`cardName${id}`).value = debt.name || `Card ${id}`;
                document.getElementById(`cardBalance${id}`).value = debt.balance || 0;
                document.getElementById(`cardAPR${id}`).value = debt.apr || 0;
                document.getElementById(`cardMinPayment${id}`).value = debt.minPayment || 0;
            }
        });
        unsecuredDebtList.innerHTML = ''; unsecuredDebtCount = 0;
        (data.unsecuredDebts || []).forEach(debt => {
            unsecuredDebtCount = Math.max(unsecuredDebtCount, parseInt(debt.origId) || 0);
            addDynamicDebtInputUI(unsecuredDebtList, 'unsecured', debt.origId);
            document.getElementById(`unsecuredName${debt.origId}`).value = debt.name || `Unsecured ${debt.origId}`;
            document.getElementById(`unsecuredBalance${debt.origId}`).value = debt.balance || 0;
            document.getElementById(`unsecuredAPR${debt.origId}`).value = debt.apr || 0;
            document.getElementById(`unsecuredMinPayment${debt.origId}`).value = debt.minPayment || 0;
        });
        extraMonthlyPaymentInput.value = data.extraMonthlyPayment || 0;
        annualBonusAmountInput.value = data.annualBonusAmount || 0;
        annualBonusMonthInput.value = data.annualBonusMonth || 0;
        lumpSumsContainer.innerHTML = ''; lumpSumCount = 0;
        (data.lumpSums || []).forEach(lump => {
            lumpSumCount = Math.max(lumpSumCount, parseInt(lump.origId) || 0);
            addLumpSumInputUI(lump.origId);
            document.getElementById(`lumpSumAmount${lump.origId}`).value = lump.amount || 0;
            document.getElementById(`lumpSumMonth${lump.origId}`).value = lump.month || 1;
        });

        updateCurrencyDisplay(); // Ensure all currency symbols are correct after loading other data
        resultsSection.style.display = 'none';
    }

    function resetAll() {
        if (!confirm("Are you sure you want to reset all inputs and clear results?")) return;
        currencySelector.value = '$';
        payoffStrategyInput.value = 'snowball'; // Reset strategy
        numCreditCardsInput.value = "1";
        debtInputsContainer.innerHTML = ""; unsecuredDebtList.innerHTML = ""; unsecuredDebtCount = 0;
        extraMonthlyPaymentInput.value = "0"; annualBonusAmountInput.value = "0"; annualBonusMonthInput.value = "0";
        lumpSumsContainer.innerHTML = ""; lumpSumCount = 0;
        
        generateCardInputsButton.click(); // This will also call updateCurrencyDisplay

        resultsSection.style.display = 'none';
        if (debtChart) { debtChart.destroy(); debtChart = null; }
        paymentScheduleTableBody.innerHTML = ''; summaryText.textContent = '';
        paymentScheduleForExport = []; window.lastCalculationData = {};
        localStorage.removeItem('debtPayoffData');
        alert("All inputs and results have been reset.");
    }

    // --- Export Functions --- (Same as previous version)
    function exportToCSV() {
        if (paymentScheduleForExport.length === 0) {
            alert("No data to export. Please calculate first."); return;
        }
        const headers = ["Month", "Year", "Debt Name", "Payment", "Interest Paid", "Principal Paid", "Remaining Balance", "Total Debt Remaining"];
        let csvContent = headers.join(",") + "\n";
        paymentScheduleForExport.forEach(entry => {
            const monthName = new Date(0, entry.month - 1).toLocaleString('default', { month: 'long' });
            const row = [
                monthName, entry.year, `"${entry.debtName.replace(/"/g, '""')}"`,
                selectedCurrencySymbol + entry.payment.toFixed(2),
                selectedCurrencySymbol + entry.interestPaid.toFixed(2),
                selectedCurrencySymbol + entry.principalPaid.toFixed(2),
                selectedCurrencySymbol + entry.remainingBalance.toFixed(2),
                entry.totalDebtRemaining !== undefined ? selectedCurrencySymbol + entry.totalDebtRemaining.toFixed(2) : '-'
            ];
            csvContent += row.join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "debt_payoff_schedule.csv");
            link.style.visibility = 'hidden'; document.body.appendChild(link);
            link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        } else { alert("CSV export not supported by your browser."); }
    }

    function exportToPDF() {
        if (paymentScheduleForExport.length === 0 || !window.jspdf) {
            alert("No data to export or PDF library not loaded. Please calculate first."); return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        doc.setFontSize(16); doc.text("Debt Payoff Report", 14, 15);
        doc.setFontSize(10); 
        const strategyText = payoffStrategyInput.options[payoffStrategyInput.selectedIndex].text;
        doc.text(`Strategy: ${strategyText}`, 14, 22);
        doc.text(summaryText.textContent, 14, 29);
        let currentY = 37;


        if (debtChart) {
            try {
                const chartImageBase64 = debtChart.toBase64Image('image/png', 1.0);
                const imgProps = doc.getImageProperties(chartImageBase64);
                const pdfChartWidth = doc.internal.pageSize.getWidth() - 28;
                const pdfChartHeight = (imgProps.height * pdfChartWidth) / imgProps.width;
                const maxHeight = 75; // Adjusted max height for chart
                const finalChartHeight = Math.min(pdfChartHeight, maxHeight);
                doc.addImage(chartImageBase64, 'PNG', 14, currentY, pdfChartWidth, finalChartHeight);
                currentY += finalChartHeight + 8;
            } catch (e) { console.error("Error adding chart to PDF:", e); currentY += 5;}
        }
        
        if (currentY > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); currentY = 15; }

        doc.setFontSize(11); doc.text("Payment Schedule", 14, currentY); currentY += 6;

        const head = [["Month", "Year", "Debt Name", "Payment", "Interest", "Principal", "Rem. Bal.", "Total Debt Rem."]];
        const body = paymentScheduleForExport.map(entry => [
            new Date(0, entry.month - 1).toLocaleString('default', { month: 'short' }),
            entry.year.toString(), entry.debtName,
            selectedCurrencySymbol + entry.payment.toFixed(2),
            selectedCurrencySymbol + entry.interestPaid.toFixed(2),
            selectedCurrencySymbol + entry.principalPaid.toFixed(2),
            selectedCurrencySymbol + entry.remainingBalance.toFixed(2),
            entry.totalDebtRemaining !== undefined ? selectedCurrencySymbol + entry.totalDebtRemaining.toFixed(2) : '-'
        ]);

        doc.autoTable({
            head: head, body: body, startY: currentY, theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
            tableWidth: 'auto',
            columnStyles: { 
                0: { cellWidth: 18 }, 1: { cellWidth: 15 }, 2: { cellWidth: 'auto' }, 
                3: { cellWidth: 25, halign: 'right' }, 4: { cellWidth: 25, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' }, 6: { cellWidth: 28, halign: 'right' },
                7: { cellWidth: 30, halign: 'right' }
            },
            didDrawPage: data => {
                doc.setFontSize(8);
                doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.height - 6);
            }
        });
        doc.save('debt_payoff_report.pdf');
    }

    // --- Initial Page Load ---
    updateCurrencyDisplay();
    generateCardInputsButton.click();
    loadData();
});