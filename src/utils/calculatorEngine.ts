/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculatorMemory, OperatorType } from '../types';

export const INITIAL_CALCULATOR_STATE: CalculatorMemory = {
  display: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
  formula: '',
  lastActionWasEquals: false,
  repeatOperand: undefined,
  repeatOperator: null,
};

// Clean floating point rounding errors (e.g. 0.1 + 0.2 = 0.3)
export function sanitizeFloat(num: number): number {
  if (!Number.isFinite(num)) return num;
  return parseFloat(num.toPrecision(12));
}

// Format display number with locale commas while typing
export function formatDisplayNumber(valueStr: string): string {
  if (valueStr === 'Error' || valueStr === '-Error' || valueStr === 'NaN') {
    return 'Error';
  }

  // Handle scientific notation directly
  if (valueStr.includes('e') || valueStr.includes('E')) {
    const num = Number(valueStr);
    if (isNaN(num)) return 'Error';
    return num.toExponential(4).replace('e+', 'e');
  }

  const parts = valueStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;

  // Format integer portion with commas
  const isNegative = integerPart.startsWith('-');
  const rawDigits = isNegative ? integerPart.slice(1) : integerPart;

  const formattedInt = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = isNegative ? '-' : '';

  if (decimalPart !== null) {
    return `${sign}${formattedInt}.${decimalPart}`;
  }

  return `${sign}${formattedInt}`;
}

export function computeOperation(prev: number, current: number, op: OperatorType): { result: number | null; error: boolean } {
  let res = 0;
  switch (op) {
    case '+':
      res = prev + current;
      break;
    case '-':
      res = prev - current;
      break;
    case '×':
      res = prev * current;
      break;
    case '÷':
      if (current === 0) {
        return { result: null, error: true };
      }
      res = prev / current;
      break;
    default:
      return { result: current, error: false };
  }

  return { result: sanitizeFloat(res), error: false };
}

export function handleNumberInput(state: CalculatorMemory, digit: string): CalculatorMemory {
  if (state.display === 'Error') {
    return {
      ...INITIAL_CALCULATOR_STATE,
      display: digit,
    };
  }

  if (state.waitingForOperand || state.lastActionWasEquals) {
    return {
      ...state,
      display: digit,
      waitingForOperand: false,
      lastActionWasEquals: false,
    };
  }

  // Prevent inputting more than 9 digits (standard iPhone limit)
  const cleanDisplay = state.display.replace('-', '').replace('.', '');
  if (cleanDisplay.length >= 9) {
    return state;
  }

  const nextDisplay = state.display === '0' ? digit : state.display + digit;
  return {
    ...state,
    display: nextDisplay,
  };
}

export function handleDecimalInput(state: CalculatorMemory): CalculatorMemory {
  if (state.display === 'Error' || state.waitingForOperand || state.lastActionWasEquals) {
    return {
      ...state,
      display: '0.',
      waitingForOperand: false,
      lastActionWasEquals: false,
    };
  }

  if (state.display.includes('.')) {
    return state; // Duplicate decimal ignored
  }

  return {
    ...state,
    display: state.display + '.',
  };
}

export function handleOperatorInput(state: CalculatorMemory, nextOperator: OperatorType): CalculatorMemory {
  if (state.display === 'Error') return INITIAL_CALCULATOR_STATE;

  const inputValue = parseFloat(state.display);

  // If user tapped an operator and then immediately switches operator without typing a number
  if (state.operator && state.waitingForOperand) {
    return {
      ...state,
      operator: nextOperator,
      formula: `${state.previousValue} ${nextOperator}`,
    };
  }

  if (state.previousValue === null) {
    return {
      ...state,
      previousValue: inputValue,
      operator: nextOperator,
      waitingForOperand: true,
      lastActionWasEquals: false,
      formula: `${inputValue} ${nextOperator}`,
    };
  }

  if (state.operator) {
    const { result, error } = computeOperation(state.previousValue, inputValue, state.operator);

    if (error || result === null) {
      return {
        ...INITIAL_CALCULATOR_STATE,
        display: 'Error',
        formula: 'Error',
      };
    }

    return {
      ...state,
      display: String(result),
      previousValue: result,
      operator: nextOperator,
      waitingForOperand: true,
      lastActionWasEquals: false,
      formula: `${result} ${nextOperator}`,
    };
  }

  return {
    ...state,
    previousValue: inputValue,
    operator: nextOperator,
    waitingForOperand: true,
    lastActionWasEquals: false,
    formula: `${inputValue} ${nextOperator}`,
  };
}

export function handleEquals(state: CalculatorMemory): { nextState: CalculatorMemory; newHistory?: { expression: string; result: string } } {
  if (state.display === 'Error') {
    return { nextState: INITIAL_CALCULATOR_STATE };
  }

  const currentVal = parseFloat(state.display);

  // Repeated equals execution: e.g. 5 + 3 = 8, pressing '=' again does 8 + 3 = 11
  if (state.lastActionWasEquals && state.repeatOperator && state.repeatOperand !== undefined) {
    const { result, error } = computeOperation(currentVal, state.repeatOperand, state.repeatOperator);

    if (error || result === null) {
      return {
        nextState: { ...INITIAL_CALCULATOR_STATE, display: 'Error', formula: 'Error' },
      };
    }

    const expression = `${currentVal} ${state.repeatOperator} ${state.repeatOperand}`;
    return {
      nextState: {
        ...state,
        display: String(result),
        formula: `${expression} =`,
      },
      newHistory: {
        expression,
        result: String(result),
      },
    };
  }

  // Normal equals execution
  if (state.operator && state.previousValue !== null) {
    const { result, error } = computeOperation(state.previousValue, currentVal, state.operator);

    if (error || result === null) {
      return {
        nextState: {
          ...INITIAL_CALCULATOR_STATE,
          display: 'Error',
          formula: 'Error',
        },
      };
    }

    const expression = `${state.previousValue} ${state.operator} ${currentVal}`;
    return {
      nextState: {
        ...state,
        display: String(result),
        previousValue: null,
        operator: null,
        waitingForOperand: true,
        lastActionWasEquals: true,
        repeatOperand: currentVal,
        repeatOperator: state.operator,
        formula: `${expression} =`,
      },
      newHistory: {
        expression,
        result: String(result),
      },
    };
  }

  return { nextState: state };
}

export function handleClear(state: CalculatorMemory): CalculatorMemory {
  // If user entered some digits while in a calculation, C clears the current entry to '0'
  if (state.display !== '0' && state.previousValue !== null && !state.waitingForOperand) {
    return {
      ...state,
      display: '0',
    };
  }

  // Otherwise, all clear
  return INITIAL_CALCULATOR_STATE;
}

export function handleToggleSign(state: CalculatorMemory): CalculatorMemory {
  if (state.display === '0' || state.display === 'Error') return state;

  const nextVal = state.display.startsWith('-')
    ? state.display.slice(1)
    : '-' + state.display;

  return {
    ...state,
    display: nextVal,
  };
}

export function handlePercentage(state: CalculatorMemory): CalculatorMemory {
  if (state.display === 'Error') return state;

  const currentVal = parseFloat(state.display);
  if (isNaN(currentVal)) return state;

  // Contextual percentage: if there is an active addition/subtraction, 100 + 10% = 10% of 100
  if (state.previousValue !== null && (state.operator === '+' || state.operator === '-')) {
    const percentOfPrev = sanitizeFloat((state.previousValue * currentVal) / 100);
    return {
      ...state,
      display: String(percentOfPrev),
    };
  }

  const result = sanitizeFloat(currentVal / 100);
  return {
    ...state,
    display: String(result),
  };
}

export function handleBackspace(state: CalculatorMemory): CalculatorMemory {
  if (state.display === 'Error' || state.waitingForOperand || state.lastActionWasEquals) {
    return state;
  }

  if (state.display.length === 1 || (state.display.length === 2 && state.display.startsWith('-'))) {
    return { ...state, display: '0' };
  }

  return {
    ...state,
    display: state.display.slice(0, -1),
  };
}
