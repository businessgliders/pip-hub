import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function CalculatorWidget({ widget }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (num) => {
    setDisplay(display === '0' ? String(num) : display + num);
  };

  const handleOperator = (op) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(equation + display);
      setDisplay(String(Number(result.toFixed(8)))); // handle float precision
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className="h-full flex flex-col p-4 bg-gray-50/50">
      <div className="flex items-center gap-2 mb-2 text-gray-500">
        <Calculator className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">Calculator</span>
      </div>
      
      <div className="bg-white rounded-lg p-2 mb-2 text-right shadow-inner border border-gray-100 flex-shrink-0 h-12 flex flex-col justify-end">
        <div className="text-[10px] text-gray-400 h-3 truncate leading-none">{equation}</div>
        <div className="text-lg font-mono text-gray-800 truncate leading-tight">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-1 flex-1 min-h-0">
        <button onClick={handleClear} className="col-span-3 p-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-sm font-medium shadow-sm transition-colors">C</button>
        <button onClick={() => handleOperator('/')} className="p-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium shadow-sm transition-colors">÷</button>
        
        <button onClick={() => handleNumber(7)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">7</button>
        <button onClick={() => handleNumber(8)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">8</button>
        <button onClick={() => handleNumber(9)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">9</button>
        <button onClick={() => handleOperator('*')} className="p-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium shadow-sm transition-colors">×</button>
        
        <button onClick={() => handleNumber(4)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">4</button>
        <button onClick={() => handleNumber(5)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">5</button>
        <button onClick={() => handleNumber(6)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">6</button>
        <button onClick={() => handleOperator('-')} className="p-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium shadow-sm transition-colors">-</button>
        
        <button onClick={() => handleNumber(1)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">1</button>
        <button onClick={() => handleNumber(2)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">2</button>
        <button onClick={() => handleNumber(3)} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">3</button>
        <button onClick={() => handleOperator('+')} className="p-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium shadow-sm transition-colors">+</button>
        
        <button onClick={() => handleNumber(0)} className="col-span-2 p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">0</button>
        <button onClick={() => handleNumber('.')} className="p-1 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-100 text-sm font-medium transition-colors">.</button>
        <button onClick={handleEqual} className="p-1 rounded-lg bg-[#f1889b] text-white hover:bg-[#f1889b]/90 text-sm font-medium shadow-sm transition-colors">=</button>
      </div>
    </div>
  );
}