
export const formatCurrency = (amount: number, symbol: string = '₹', currency: string = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const numberToWords = (n: number): string => {
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const inWords = (num: number): string => {
    if (num === 0) return 'zero';
    let words = '';
    if (num >= 1000000) {
      words += inWords(Math.floor(num / 1000000)) + ' million ';
      num %= 1000000;
    }
    if (num >= 1000) {
      words += inWords(Math.floor(num / 1000)) + ' thousand ';
      num %= 1000;
    }
    if (num >= 100) {
      words += inWords(Math.floor(num / 100)) + ' hundred ';
      num %= 100;
    }
    if (num > 0) {
      if (words !== '') words += 'and ';
      if (num < 20) words += a[num];
      else {
        words += b[Math.floor(num / 10)];
        if (num % 10 > 0) words += '-' + a[num % 10];
      }
    }
    return words.trim();
  };

  const amount = Math.floor(n);
  const result = inWords(amount);
  
  return result.charAt(0).toUpperCase() + result.slice(1) + ' only';
};
