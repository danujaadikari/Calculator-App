// Calculator Application JavaScript
// Author: Advanced Calculator
// Features: Basic/Scientific Calculator, Unit Converter, History, Dark Mode

class AdvancedCalculator {
    constructor() {
        // Calculator state
        this.displayValue = '0';
        this.previousValue = '';
        this.operator = '';
        this.waitingForOperand = false;
        this.history = [];
        this.currentMode = 'basic';
        
        // DOM elements
        this.display = document.getElementById('display');
        this.previousOperation = document.getElementById('previousOperation');
        this.historyList = document.getElementById('historyList');
        
        // Initialize calculator
        this.init();
    }
    
    init() {
        this.loadHistory();
        this.loadTheme();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Mode switching
        document.getElementById('basicMode').addEventListener('click', () => this.switchMode('basic'));
        document.getElementById('scientificMode').addEventListener('click', () => this.switchMode('scientific'));
        
        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Prevent context menu on buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }
    
    // Display management
    updateDisplay() {
        this.display.textContent = this.formatNumber(this.displayValue);
        this.display.classList.remove('error', 'calculating');
    }
    
    formatNumber(num) {
        if (num === 'Error' || num === 'Infinity' || num === '-Infinity') {
            return num;
        }
        
        const number = parseFloat(num);
        if (isNaN(number)) return num;
        
        // Handle very large or very small numbers
        if (Math.abs(number) > 999999999 || (Math.abs(number) < 0.000001 && number !== 0)) {
            return number.toExponential(6);
        }
        
        // Format with appropriate decimal places
        return number.toString();
    }
    
    // Input handling
    inputNumber(digit) {
        if (this.waitingForOperand) {
            this.displayValue = digit;
            this.waitingForOperand = false;
        } else {
            this.displayValue = this.displayValue === '0' ? digit : this.displayValue + digit;
        }
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    inputDecimal() {
        if (this.waitingForOperand) {
            this.displayValue = '0.';
            this.waitingForOperand = false;
        } else if (this.displayValue.indexOf('.') === -1) {
            this.displayValue += '.';
        }
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    inputOperator(nextOperator) {
        const inputValue = parseFloat(this.displayValue);
        
        if (this.previousValue === '') {
            this.previousValue = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousValue || 0;
            const result = this.performCalculation(currentValue, inputValue, this.operator);
            
            this.displayValue = `${parseFloat(result.toFixed(10))}`;
            this.previousValue = result;
        }
        
        this.waitingForOperand = true;
        this.operator = nextOperator;
        
        // Update previous operation display
        this.previousOperation.textContent = `${this.previousValue} ${this.getOperatorSymbol(this.operator)}`;
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    inputFunction(func) {
        if (this.waitingForOperand || this.displayValue === '0') {
            this.displayValue = func;
            this.waitingForOperand = false;
        } else {
            this.displayValue += func;
        }
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    // Calculation logic
    calculate() {
        const inputValue = parseFloat(this.displayValue);
        
        if (this.previousValue !== '' && this.operator) {
            const currentValue = this.previousValue || 0;
            const result = this.performCalculation(currentValue, inputValue, this.operator);
            
            // Add to history
            const expression = `${this.previousValue} ${this.getOperatorSymbol(this.operator)} ${inputValue}`;
            this.addToHistory(expression, result);
            
            this.displayValue = `${parseFloat(result.toFixed(10))}`;
            this.previousValue = '';
            this.operator = '';
            this.previousOperation.textContent = '';
            this.waitingForOperand = true;
        } else if (this.displayValue.includes('sin(') || this.displayValue.includes('cos(') || 
                  this.displayValue.includes('tan(') || this.displayValue.includes('log(') || 
                  this.displayValue.includes('ln(') || this.displayValue.includes('sqrt(')) {
            // Handle scientific functions
            try {
                const result = this.evaluateScientificExpression(this.displayValue);
                this.addToHistory(this.displayValue, result);
                this.displayValue = `${result}`;
                this.waitingForOperand = true;
            } catch (error) {
                this.displayValue = 'Error';
                this.display.classList.add('error');
            }
        }
        
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    performCalculation(firstValue, secondValue, operator) {
        try {
            switch (operator) {
                case '+':
                    return firstValue + secondValue;
                case '-':
                    return firstValue - secondValue;
                case '*':
                    return firstValue * secondValue;
                case '/':
                    if (secondValue === 0) {
                        throw new Error('Division by zero');
                    }
                    return firstValue / secondValue;
                case '%':
                    return firstValue % secondValue;
                case '^':
                    return Math.pow(firstValue, secondValue);
                default:
                    return secondValue;
            }
        } catch (error) {
            return 'Error';
        }
    }
    
    evaluateScientificExpression(expression) {
        // Replace scientific functions with Math equivalents
        let mathExpression = expression
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/\^/g, '**');
        
        // Convert degrees to radians for trigonometric functions
        mathExpression = mathExpression.replace(/Math\.(sin|cos|tan)\(([^)]+)\)/g, (match, func, angle) => {
            return `Math.${func}(${angle} * Math.PI / 180)`;
        });
        
        // Evaluate the expression safely
        try {
            // Use Function constructor for safer evaluation than eval
            const result = new Function('return ' + mathExpression)();
            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Invalid calculation');
            }
            return parseFloat(result.toFixed(10));
        } catch (error) {
            throw new Error('Invalid expression');
        }
    }
    
    getOperatorSymbol(operator) {
        const symbols = {
            '+': '+',
            '-': '-',
            '*': '×',
            '/': '÷',
            '%': '%',
            '^': '^'
        };
        return symbols[operator] || operator;
    }
    
    // Clear functions
    clearAll() {
        this.displayValue = '0';
        this.previousValue = '';
        this.operator = '';
        this.previousOperation.textContent = '';
        this.waitingForOperand = false;
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    clearEntry() {
        this.displayValue = '0';
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    deleteDigit() {
        if (this.displayValue.length > 1) {
            this.displayValue = this.displayValue.slice(0, -1);
        } else {
            this.displayValue = '0';
        }
        this.updateDisplay();
        this.addButtonAnimation(event.target);
    }
    
    // Mode switching
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update active mode button
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Mode').classList.add('active');
        
        // Show/hide appropriate grid
        document.getElementById('basicGrid').style.display = mode === 'basic' ? 'grid' : 'none';
        document.getElementById('scientificGrid').style.display = mode === 'scientific' ? 'grid' : 'none';
        
        // Clear calculator when switching modes
        this.clearAll();
    }
    
    // History management
    addToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleString()
        };
        
        this.history.unshift(historyItem);
        
        // Limit history to 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
        this.saveHistory();
    }
    
    updateHistoryDisplay() {
        const historyContainer = this.historyList;
        
        if (this.history.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">No calculations yet</p>';
            return;
        }
        
        historyContainer.innerHTML = this.history.map((item, index) => `
            <div class="history-item" onclick="calculator.useHistoryItem(${index})">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${this.formatNumber(item.result)}</div>
            </div>
        `).join('');
    }
    
    useHistoryItem(index) {
        const item = this.history[index];
        this.displayValue = item.result.toString();
        this.previousValue = '';
        this.operator = '';
        this.previousOperation.textContent = '';
        this.waitingForOperand = true;
        this.updateDisplay();
    }
    
    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveHistory();
    }
    
    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.updateHistoryDisplay();
        }
    }
    
    // Theme management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        
        // Save theme preference
        localStorage.setItem('calculatorTheme', newTheme);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('calculatorTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Keyboard support
    handleKeyboard(event) {
        const key = event.key;
        
        // Prevent default for calculator keys
        if ('0123456789+-*/.=()%'.includes(key) || key === 'Enter' || key === 'Escape' || key === 'Backspace') {
            event.preventDefault();
        }
        
        // Number keys
        if (/[0-9]/.test(key)) {
            this.inputNumber(key);
        }
        
        // Operator keys
        switch (key) {
            case '+':
                this.inputOperator('+');
                break;
            case '-':
                this.inputOperator('-');
                break;
            case '*':
                this.inputOperator('*');
                break;
            case '/':
                this.inputOperator('/');
                break;
            case '%':
                this.inputOperator('%');
                break;
            case '.':
                this.inputDecimal();
                break;
            case '=':
            case 'Enter':
                this.calculate();
                break;
            case 'Escape':
                this.clearAll();
                break;
            case 'Backspace':
                this.deleteDigit();
                break;
            case '(':
                this.inputOperator('(');
                break;
            case ')':
                this.inputOperator(')');
                break;
        }
    }
    
    // Button animation
    addButtonAnimation(button) {
        if (button && button.classList.contains('btn')) {
            button.classList.add('pressed');
            setTimeout(() => button.classList.remove('pressed'), 100);
        }
    }
}

// Unit Converter Class
class UnitConverter {
    constructor() {
        this.currentConverter = 'length';
        this.conversions = {
            length: {
                m: 1,
                cm: 100,
                mm: 1000,
                km: 0.001,
                in: 39.3701,
                ft: 3.28084,
                yd: 1.09361,
                mi: 0.000621371
            },
            weight: {
                kg: 1,
                g: 1000,
                lb: 2.20462,
                oz: 35.274,
                stone: 0.157473,
                ton: 0.001
            },
            temperature: {
                c: { c: (c) => c, f: (c) => c * 9/5 + 32, k: (c) => c + 273.15 },
                f: { c: (f) => (f - 32) * 5/9, f: (f) => f, k: (f) => (f - 32) * 5/9 + 273.15 },
                k: { c: (k) => k - 273.15, f: (k) => (k - 273.15) * 9/5 + 32, k: (k) => k }
            }
        };
    }
    
    switchConverter(type) {
        this.currentConverter = type;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Show appropriate converter
        document.querySelectorAll('.converter-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(type + 'Converter').style.display = 'block';
        
        // Clear inputs
        this.clearInputs(type);
    }
    
    convertLength(direction) {
        const fromInput = document.getElementById('lengthFrom');
        const toInput = document.getElementById('lengthTo');
        const fromUnit = document.getElementById('lengthFromUnit').value;
        const toUnit = document.getElementById('lengthToUnit').value;
        
        if (direction === 'from') {
            const value = parseFloat(fromInput.value) || 0;
            const meters = value / this.conversions.length[fromUnit];
            const result = meters * this.conversions.length[toUnit];
            toInput.value = this.formatConversionResult(result);
        } else {
            const value = parseFloat(toInput.value) || 0;
            const meters = value / this.conversions.length[toUnit];
            const result = meters * this.conversions.length[fromUnit];
            fromInput.value = this.formatConversionResult(result);
        }
    }
    
    convertWeight(direction) {
        const fromInput = document.getElementById('weightFrom');
        const toInput = document.getElementById('weightTo');
        const fromUnit = document.getElementById('weightFromUnit').value;
        const toUnit = document.getElementById('weightToUnit').value;
        
        if (direction === 'from') {
            const value = parseFloat(fromInput.value) || 0;
            const kg = value / this.conversions.weight[fromUnit];
            const result = kg * this.conversions.weight[toUnit];
            toInput.value = this.formatConversionResult(result);
        } else {
            const value = parseFloat(toInput.value) || 0;
            const kg = value / this.conversions.weight[toUnit];
            const result = kg * this.conversions.weight[fromUnit];
            fromInput.value = this.formatConversionResult(result);
        }
    }
    
    convertTemperature(direction) {
        const fromInput = document.getElementById('tempFrom');
        const toInput = document.getElementById('tempTo');
        const fromUnit = document.getElementById('tempFromUnit').value;
        const toUnit = document.getElementById('tempToUnit').value;
        
        if (direction === 'from') {
            const value = parseFloat(fromInput.value) || 0;
            const result = this.conversions.temperature[fromUnit][toUnit](value);
            toInput.value = this.formatConversionResult(result);
        } else {
            const value = parseFloat(toInput.value) || 0;
            const result = this.conversions.temperature[toUnit][fromUnit](value);
            fromInput.value = this.formatConversionResult(result);
        }
    }
    
    formatConversionResult(value) {
        if (Math.abs(value) > 999999 || (Math.abs(value) < 0.000001 && value !== 0)) {
            return value.toExponential(6);
        }
        return parseFloat(value.toFixed(8)).toString();
    }
    
    clearInputs(type) {
        const inputs = document.querySelectorAll(`#${type}Converter input`);
        inputs.forEach(input => input.value = '');
    }
}

// Global instances and functions
let calculator;
let converter;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    calculator = new AdvancedCalculator();
    converter = new UnitConverter();
});

// Global function exports for HTML onclick handlers
function inputNumber(digit) {
    calculator.inputNumber(digit);
}

function inputDecimal() {
    calculator.inputDecimal();
}

function inputOperator(op) {
    calculator.inputOperator(op);
}

function inputFunction(func) {
    calculator.inputFunction(func);
}

function calculate() {
    calculator.calculate();
}

function clearAll() {
    calculator.clearAll();
}

function clearEntry() {
    calculator.clearEntry();
}

function deleteDigit() {
    calculator.deleteDigit();
}

function clearHistory() {
    calculator.clearHistory();
}

function switchConverter(type) {
    converter.switchConverter(type);
}

function convertLength(direction) {
    converter.convertLength(direction);
}

function convertWeight(direction) {
    converter.convertWeight(direction);
}

function convertTemperature(direction) {
    converter.convertTemperature(direction);
}